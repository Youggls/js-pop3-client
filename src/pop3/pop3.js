import { Socket } from 'net'
import _tls from 'tls'
import { EventEmitter } from 'events'
import { Readable } from 'stream'

// constants
import {
  CRLF,
  CRLF_BUFFER,
  TERMINATOR_BUFFER,
  TERMINATOR_BUFFER_ARRAY,
  MULTI_LINE_COMMAND_NAME
} from './constants'

function stream2String(stream) {
  return new Promise((resolve, reject) => {
    let buffer = Buffer.concat([])
    let {length} = buffer
    stream.on('data', (_buffer) => {
      length += _buffer.length
      buffer = Buffer.concat([buffer, _buffer], length)
    })
    stream.on('error', (err) => reject(err))
    stream.on('end', () => resolve(buffer.toString()))
  })
}

function listify(str) {
  return str.split(CRLF)
    .filter((line) => line)
    .map((line) => line.split(' '))
}

export default class Pop3 extends EventEmitter {
  constructor(host, port, user, password, tls=false, timeout=5000, tlsOptions={}) {
    // construction
    super()
    this.host = host
    this.port = port
    this.user = user
    this.password = password
    this.timeout = timeout
    this.tls = tls
    this.tlsOptions = tlsOptions
    this._socket = null
    this._stream = null
    this._PASSInfo = ''
  }

  _updateStream() {
    this._stream = new Readable({
      read: () => {},
    })
    return this._stream
  }

  _pushStream(buffer) {
    if (TERMINATOR_BUFFER_ARRAY.some((_buffer) => _buffer.equals(buffer))) {
      // if buffer is terminator (\r\n.\r\n, .\r\n), end stream
      return this._endStream()
    }
    const endBuffer = buffer.slice(-5)
    if (endBuffer.equals(TERMINATOR_BUFFER)) {
      this._stream.push(buffer.slice(0, -5))
      return this._endStream()
    }
    this._stream.push(buffer)
  }

  _endStream(err) {
    if (this._stream) {
      this._stream.push(null)
    }
    this._stream = null
    this.emit('end', err)
  }

  _initSocket() {
    const { host, port, tlsOptions } = this
    const socket = new Socket()
    socket.setKeepAlive(true)
    return new Promise((resolve, reject) => {
      // handle time out, if time out, emit end and error, clear socket.
      socket.setTimeout(this.timeout, () => {
        const err = new Error('Socket timeout')
        err.eventName = 'timeout'
        reject(err)
        if (this.listeners('end').length > 0) {
          this.emit('end', err)
        }
        if (this.listeners('error').length > 0) {
          this.emit('error', err)
        }
        this._socket.end()
        this._socket = null
      })

      // If use tls is true, use tls.connect instead of socket.connect
      if (this.tls) {
        const options = Object.assign({ host, port, tlsOptions })
        this._socket = _tls.connect(options)
      } else {
        this._socket = socket
      }

      // register 'data' event
      this._socket.on('data', (buffer) => {
        if (this._stream) {
          // push stream
          return this._pushStream(buffer)
        }
        if (buffer[0] === 45) { // '-'
          const err = new Error(buffer.slice(5, -2))
          err.eventName = 'error'
          err.command = this._command
          return this.emit('error', err)
        }
        if (buffer[0] === 43) { // '+'
          const firstLineEndIndex = buffer.indexOf(CRLF_BUFFER)
          const infoBuffer = buffer.slice(4, firstLineEndIndex)
          const [commandName] = (this._command || '').split(' ')
          let stream = null
          if (MULTI_LINE_COMMAND_NAME.includes(commandName)) {
            this._updateStream()
            stream = this._stream
            const bodyBuffer = buffer.slice(firstLineEndIndex + 2)
            if (bodyBuffer[0]) {
              this._pushStream(bodyBuffer)
            }
          }
          this.emit('response', infoBuffer.toString(), stream)
          resolve()
          return
        }
        const err = new Error('Unexpected response')
        err.eventName = 'bad-server-response'
        reject(err)
      })
      // register error event
      this._socket.on('error', (err) => {
        err.eventName = 'error'
        if (this._stream) {
          this.emit('error', err)
          return
        }
        reject(err)
        this._socket = null
      })
      this._socket.once('close', () => {
        const err = new Error('close')
        err.eventName = 'close'
        reject(err)
        this._socket = null
      })
      this._socket.once('end', () => {
        const err = new Error('end')
        err.eventName = 'end'
        reject(err)
        this._socket = null
      })
      // connect
      socket.connect({
        host,
        port,
      })
    })
  }

  async command(...args) {
    this._command = args.join(' ')
    if (!this._socket) {
      throw new Error('no-socket')
    }
    await new Promise((resolve, reject) => {
      if (!this._stream) {
        return resolve()
      }
      this.once('error', (err) => {
        return reject(err)
      })
      this.once('end', (err) => {
        return err ? reject(err) : resolve()
      })
    })
    return new Promise((resolve, reject) => {
      const rejectFn = (err) => reject(err)
      this.once('error', rejectFn)
      this.once('response', (info, stream) => {
        this.removeListener('error', rejectFn)
        resolve([info, stream])
      })
      if (!this._socket) {
        reject(new Error('no-socket'))
      }
      this._socket.write(`${this._command}${CRLF}`, 'utf8')
    })
  }

  async _connect() {
    if (this._socket) {
      return this._PASSInfo
    }
    await this._initSocket()
    const info1 = await this.command('USER', this.user)
    const [info] = await this.command('PASS', this.password)
    console.log(info)
    console.log(info1)
    this._PASSInfo = info
    return this._PASSInfo
  }

  async CONNECT() {
    return await this._connect()
  }

  async LIST(msgNumber = '') {
    await this._connect()
    const [, stream] = await this.command('LIST', msgNumber)
    const str = await stream2String(stream)
    const list = listify(str)
    return msgNumber ? list[0] : list
  }

  async RETR(msgNumber) {
    await this._connect()
    const [, stream] = await this.command('RETR', msgNumber)
    return stream2String(stream)
  }

  async STAT() {
    await this._connect()
    const [info] = await this.command('STAT')
    return info
  }

  async QUIT() {
    if (!this._socket) {
      this._PASSInfo = '' || 'Bye';
      return this._PASSInfo;
    }
    const [info] = await super.command('QUIT');
    this._PASSInfo = info || '';
    return this._PASSInfo;
  }
}
