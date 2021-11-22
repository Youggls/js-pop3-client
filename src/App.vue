<template>
  <div>
    user name:
    <input type="text" v-model="userName" />
    pop server:
    <input type="text" v-model="popServer" />
    password:
    <input type="text" v-model="password" />
    port:
    <input type="text" v-model="port" />
    <button v-on:click="connectButton()">connect</button>
  </div>
</template>

<script>
import Pop3Command from "node-pop3"
export default {
  name: "pop3",
  props: {
    msg: String,
  },
  data() {
    return {
      userName: "",
      popServer: "",
      password: "",
      port: "",
      socket: null,
    }
  },
  mounted() {
    
  },
  methods: {
    connectButton() {
      this.pop3 = new Pop3Command({
        user: this.userName,
        password: this.password,
        host: this.popServer,
        port: 995,
        tls: true,
    });
    (async () => {
      console.log("connecting...")
      await this.pop3.connect()
      console.log("connected")
      await this.pop3.command("USER", this.userName)
      await this.pop3.command("PASS", this.password)

      const [info] = await this.pop3.command("STAT")
      console.log(info) // 100 10240
    })()
    }
  },
}
</script>
