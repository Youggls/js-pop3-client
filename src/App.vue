<template>
  <div>
    <a-form :model="formState" :label-col="labelCol" :wrapper-col="wrapperCol">
      <a-form-item label="user name">
        <a-input type="text" v-model="userName" />
      </a-form-item>
      <a-form-item label="pop server">
        <a-input type="text" v-model="popServer" />
      </a-form-item>
      <a-form-item label="pop port">
        <a-input type="text" v-model="port" />
      </a-form-item>
      <a-form-item label="password">
        <a-input-password type="text" v-model="password" />
      </a-form-item>
      <a-button type="primary" v-on:click="connectButton()">
        connect
      </a-button>
    </a-form>
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
