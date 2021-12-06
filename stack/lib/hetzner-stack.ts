import { TerraformOutput, TerraformStack } from "cdktf";
import * as cloudinit from "../.gen/providers/cloudinit";
import * as hcloud from "../.gen/providers/hcloud";
import * as fs from "fs";
import {
  WireguardCloudInit,
  WireguardServerProps,
} from "./wireguard-cloud-init";
import { Construct } from "constructs";

const defaultServerImage = "ubuntu-20.04";
const defaultServerType = "cx11";
const defaultServerLocation = "nbg1";

export interface HetznerStackProps extends WireguardServerProps {
  hcloudToken: string;
  sshKeyPath: string;
  serverImage?: string;
  serverType?: string;
  serverLocation?: string;
}

export class HetznerStack extends TerraformStack {
  constructor(scope: Construct, name: string, props: HetznerStackProps) {
    super(scope, name);

    new hcloud.HcloudProvider(this, "CloudProvider", {
      token: props.hcloudToken,
    });

    new cloudinit.CloudinitProvider(this, "CloudInitProvider");

    const publicKey = fs.readFileSync(props.sshKeyPath, "utf8");
    const sshKey = new hcloud.SshKeyA(this, "SshKey", {
      name: `${name} Key`,
      publicKey,
    });

    const userData = new WireguardCloudInit(this, "WireguardCloudInit", {
      ...props,
      sshKey: publicKey,
      base64Encode: true,
    });

    const server = new hcloud.Server(this, "VpnServer", {
      name: "vpn-server",
      image: props.serverImage ?? defaultServerImage,
      serverType: props.serverType ?? defaultServerType,
      location: props.serverLocation ?? defaultServerLocation,
      sshKeys: [sshKey.id],
      userData: userData.rendered,
    });

    [
      ["server-id", server.id],
      ["server-ip", server.ipv4Address],
      ["server-status", server.status],
      ["server-vpn-port", userData.serverPort],
      ["server-vpn-network", userData.serverAddress],
      ["client-vpn-address", userData.clientAddress],
      ["ssh-user", userData.sshUser],
    ].map(
      ([k, v]) =>
        new TerraformOutput(this, k as string, {
          value: v,
        })
    );
  }
}
