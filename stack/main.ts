import { App } from "./lib/core/app";
import { HetznerStack } from "./lib/hetzner-stack";
import * as path from "path";
import { DigitalOceanStack } from "./lib/digitalocean-stack";

const app = new App();

const sshKeyPath = app.mustContext(
  "sshKeyPath",
  path.join(process.env.HOME as string, ".ssh", "id_ecdsa.pub")
);
const vpnServerPrivateKey = app.mustContext("vpnServerPrivateKey");
const vpnClientPublicKey = app.mustContext("vpnClientPublicKey");

const vpnServerAddress = app.context("vpnNetwork");
const vpnServerPort = app.context("vpnPort");
const vpnClientAddress = app.context("vpnNetwork");
const provider = app.context("provider", "hetzner");

switch (provider) {
  case "hetzner":
    new HetznerStack(app, "VpnStack", {
      hcloudToken: app.mustContext("hcloudToken"),
      serverImage: app.context("serverImage"),
      serverType: app.context("serverType"),
      serverLocation: app.context("serverLocation"),
      sshKeyPath,
      vpnClientAddress,
      vpnClientPublicKey,
      vpnServerAddress,
      vpnServerPort,
      vpnServerPrivateKey,
    });
    break;
  case "digitalocean":
    new DigitalOceanStack(app, "VpnStack", {
      digitalOceanToken: app.mustContext("digitalOceanToken"),
      serverImage: app.context("serverImage"),
      serverSize: app.context("serverSize"),
      serverRegion: app.context("serverRegion"),
      sshKeyPath,
      vpnClientAddress,
      vpnClientPublicKey,
      vpnServerAddress,
      vpnServerPort,
      vpnServerPrivateKey,
    });
    break;
  default:
    throw new Error(
      `Unsupported provider ${provider}. Use hetzner or digitalocean`
    );
}

app.synth();
