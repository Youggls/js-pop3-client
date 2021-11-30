<template>
  <a-layout-header>
    <!-- <div class="logo" /> -->

    <MailOutlined style="color: rgb(255, 255, 255); fontsize: 30px" />
  </a-layout-header>
  <a-form layout="inline" style="margin-top: 30px; margin-left: 20px">
    <a-form-item label="UserName">
      <a-input
        type="text"
        v-model:value="userName"
        placeholder="Your Email Name"
      >
        <template #prefix
          ><UserOutlined style="color: rgba(0, 0, 0, 0.25)"
        /></template>
      </a-input>
    </a-form-item>
    <a-form-item label="Password">
      <a-input-password type="text" v-model:value="password">
        <template #prefix
          ><LockOutlined style="color: rgba(0, 0, 0, 0.25)"
        /></template>
      </a-input-password>
    </a-form-item>
    <a-form-item label="ServerAddress">
      <a-input
        type="text"
        v-model:value="popServer"
        placeholder="pop.example.com"
      >
      </a-input>
    </a-form-item>
    <a-form-item label="ServerPort">
      <a-input type="text" v-model:value="port" placeholder="eg: 995" />
    </a-form-item>
    <a-form-item label="Msg #">
      <a-input type="number" v-model:value="msgNumber" placeholder="1" />
    </a-form-item>
    <a-form-item>
      <a-checkbox v-model:checked="checked">TLS</a-checkbox>
    </a-form-item>
  </a-form>
  <a-form
    layout="inline"
    style="margin-top: 30px; margin-left: 100px; margin-bottom: 30px"
  >
    <a-form-item>
      <a-button type="primary" v-on:click="connectButton()"> CONNECT </a-button>
    </a-form-item>
    <a-form-item>
      <a-button type="primary" v-on:click="listButton()"> LIST </a-button>
    </a-form-item>
    <a-form-item>
      <a-button type="primary" v-on:click="retrButton()"> RETR </a-button>
    </a-form-item>
    <a-form-item>
      <a-button type="primary" v-on:click="statButton()"> STAT </a-button>
    </a-form-item>
    <a-form-item>
      <a-button type="danger" v-on:click="quitButton()"> QUIT </a-button>
    </a-form-item>
    <a-form-item>
      <a-button type="danger" v-on:click="clearButton()"> Clear Info </a-button>
    </a-form-item>
  </a-form>
  <a-row>
    <a-col :span="1"></a-col>
    <a-col :span="10">
      <a-card title="Command Info">
        <p v-for="item in commandInfoList" :key="item">{{ item }}</p>
      </a-card>
    </a-col>
    <a-col :span="2"></a-col>
    <a-col :span="10">
      <a-card title="Mail Info">
        {{ mailInfo }}
      </a-card>
    </a-col>
    <a-col :span="1"></a-col>
  </a-row>
</template>

<script>
import Pop3 from "./pop3/pop3.js";
import { message } from "ant-design-vue";
import {
  MailOutlined,
  LockOutlined,
  UserOutlined,
} from "@ant-design/icons-vue";
export default {
  components: {
    MailOutlined,
    LockOutlined,
    UserOutlined,
  },
  props: {
    msg: String,
  },
  data() {
    return {
      userName: "",
      popServer: "",
      password: "",
      port: "",
      msgNumber: 1,
      pop3: null,
      commandInfoList: [],
      mailInfo: "",
      checked: false,
    };
  },
  mounted() {},
  methods: {
    showErr(errMsg) {
      message.error(errMsg);
    },
    connectButton() {
      (async () => {
        try {
          let pop3 = new Pop3(
            this.popServer,
            parseInt(this.port),
            this.userName,
            this.password,
            this.checked
          );
          await pop3._initSocket();
          const [userResult] = await pop3.command("USER", this.userName);
          const [passResult] = await pop3.command("PASS", this.password);
          this.commandInfoList.push(">>> USER");
          this.commandInfoList.push("<<< " + userResult + "");
          this.commandInfoList.push(">>> PASS");
          this.commandInfoList.push(">>> " + passResult + "");
          this.pop3 = pop3;
          message.success("Connected!");
        } catch {
          message.error("Connection error! Please check your input or connection!");
        }
      })();
    },
    listButton() {
      if (this.pop3 !== null) {
        (async () => {
          let pop3 = new Pop3(
            this.popServer,
            parseInt(this.port),
            this.userName,
            this.password,
            this.checked
          );
          await pop3._initSocket();
          await pop3.command("USER", this.userName);
          await pop3.command("PASS", this.password);
          let listRes = await pop3.LIST();
          if (listRes instanceof Array) listRes = listRes[listRes.length - 1];
          this.commandInfoList.push(">>> LIST");
          this.commandInfoList.push("<<< " + listRes);
        })();
      } else {
        this.showErr("Please connect first!");
      }
    },
    retrButton() {
      if (this.pop3 !== null) {
        (async () => {
          let pop3 = new Pop3(
            this.popServer,
            parseInt(this.port),
            this.userName,
            this.password,
            this.checked
          );
          await pop3._initSocket();
          await pop3.command("USER", this.userName);
          await pop3.command("PASS", this.password);
          const [res, stream] = await pop3.command("RETR", this.msgNumber);
          this.commandInfoList.push(">>> RETR");
          this.commandInfoList.push("<<< " + res);
          this.mailInfo = await this.stream2String(stream);
        })();
      } else {
        this.showErr("Please connect first!");
      }
    },
    statButton() {
      if (this.pop3 !== null) {
        (async () => {
          let pop3 = new Pop3(
            this.popServer,
            parseInt(this.port),
            this.userName,
            this.password,
            this.checked
          );
          await pop3._initSocket();
          await pop3.command("USER", this.userName);
          await pop3.command("PASS", this.password);
          const [statInfo] = await pop3.command("STAT");
          this.commandInfoList.push(">>> STAT");
          this.commandInfoList.push("<<< " + statInfo);
        })();
      } else {
        this.showErr("Please connect first!");
      }
    },
    quitButton() {
      if (this.pop3 !== null) {
        (async () => {
          let pop3 = new Pop3(
            this.popServer,
            parseInt(this.port),
            this.userName,
            this.password,
            this.checked
          );
          await pop3._initSocket();
          await pop3.command("USER", this.userName);
          await pop3.command("PASS", this.password);
          const [quitInfo] = await pop3.command("QUIT");
          this.commandInfoList.push(">>> QUIT");
          this.commandInfoList.push("<<< " + quitInfo);
          this.pop3 = null;
          message.success("Quit successfully");
        })();
      } else {
        this.showErr("Not connected!");
      }
    },
    clearButton() {
      this.mailInfo = "";
      this.commandInfoList = [];
    },
    stream2String(stream) {
      return new Promise((resolve, reject) => {
        let buffer = Buffer.concat([]);
        let { length } = buffer;
        stream.on("data", (_buffer) => {
          length += _buffer.length;
          buffer = Buffer.concat([buffer, _buffer], length);
        });
        stream.on("error", (err) => reject(err));
        stream.on("end", () => resolve(buffer.toString()));
      });
    },
  },
};
</script>
<style scoped>
</style>