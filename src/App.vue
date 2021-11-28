<template>
  <div>
    <a-card class="content-card">
      <a-form :model="formState" :label-col="{span: 8}" :wrapper-col="{span: 8}" :layout="vertical">
        <a-form-item label="user name">
          <a-input type="text" v-model:value="userName" />
        </a-form-item>
        <a-form-item label="pop server">
          <a-input type="text" v-model:value="popServer" />
        </a-form-item>
        <a-form-item label="pop port">
          <a-input type="text" v-model:value="port" />
        </a-form-item>
        <a-form-item label="password">
          <a-input-password type="text" v-model:value="password" />
        </a-form-item>
        <a-form-item :wrapper-col="{span: 8, offset: 8}">
          <a-button type="primary" v-on:click="connectButton()">
            connect
          </a-button>
        </a-form-item>
      </a-form>
    </a-card>
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
    console.log(this.pop3);
    (async () => {
      console.log("connecting...")
      await this.pop3.connect()
      console.log("connected")
      await this.pop3.command("USER", this.userName)
      await this.pop3.command("PASS", this.password)
      const [info, stream] = await this.pop3.command("LIST")
      console.log(info) // 100 10240
      console.log(stream) // 10240
    })()
    }
  },
}
</script>
<style scoped>
content-card {
  margin-top: 100px;
  width: 800px;
  text-align: center;
}

</style>