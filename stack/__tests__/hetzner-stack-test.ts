import { Testing } from "cdktf";
import "cdktf/lib/testing/adapters/jest"; // Load types for expect matchers
import * as hcloud from "../.gen/providers/hcloud";
import * as path from "path";
import { HetznerStack, HetznerStackProps } from "../lib/hetzner-stack";

describe("Hetzner Stack", () => {
  const newStack = (props?: Partial<HetznerStackProps>) => {
    const app = Testing.app();
    return new HetznerStack(app, "Stack", {
      hcloudToken: "the-token",
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
      hcloud.SshKeyA,
      {
        public_key: "public key content",
      }
    );
  });
  it("Creates VPN server with defaults", () => {
    expect(Testing.synth(newStack())).toHaveResourceWithProperties(
      hcloud.Server,
      {
        name: "vpn-server",
        location: "nbg1",
        server_type: "cx11",
        image: "ubuntu-20.04",
      }
    );
  });
});
