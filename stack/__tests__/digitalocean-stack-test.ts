import { Testing } from "cdktf";
import "cdktf/lib/testing/adapters/jest"; // Load types for expect matchers
import * as digitalocean from "../.gen/providers/digitalocean";
import * as path from "path";
import {
  DigitalOceanStack,
  DigitalOceanStackProps,
} from "../lib/digitalocean-stack";

describe("DigitalOcean Stack", () => {
  const newStack = (props?: Partial<DigitalOceanStackProps>) => {
    const app = Testing.app();
    return new DigitalOceanStack(app, "Stack", {
      digitalOceanToken: "the-token",
      sshKeyPath: path.join(__dirname, "fixtures", "dummy.key"),
      vpnClientPublicKey: "pub-key",
      vpnServerPrivateKey: "priv-key",
      ...props,
    });
  };
  it("Renders as expected", () => {
    expect(Testing.synth(newStack())).toMatchSnapshot();
  });
  it("Creates SSH key from disk", () => {
    expect(Testing.synth(newStack())).toHaveResourceWithProperties(
      digitalocean.SshKey,
      {
        public_key: "public key content",
      }
    );
  });
  it("Creates VPN droplet with defaults", () => {
    expect(Testing.synth(newStack())).toHaveResourceWithProperties(
      digitalocean.Droplet,
      {
        name: "vpn-server",
        region: "fra1",
        size: "s-1vcpu-1gb",
        image: "ubuntu-20-04-x64",
      }
    );
  });
});
