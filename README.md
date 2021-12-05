# Road Warrior VPN in Terraform CDK

Playing around with [Terraform CDK](https://github.com/hashicorp/terraform-cdk) again. This time I am creating a [Wireguard](https://www.wireguard.com/) based "Road Warrior" VPN setup, that I intend to use with my Mac.

Provided are commands to start VPN servers in either [DigitalOcean](https://digitalocean.com/) or [Hetzner Cloud](https://www.hetzner.com/cloud) infrastructures.

This tooling could be easily adapted to use with about any other cloud provider for which a [Terraform provider exists](https://registry.terraform.io/browse/providers) and that offers VMs which can be configured via [cloud-init](https://cloudinit.readthedocs.io/).

**!!BE AWARE!! USING THIS TOOLING WILL USE RESOURCES WITH YOUR CLOUD PROVIDER THAT COST MONEY !!BE AWARE!!**

## Usage

To use this tooling you need to have a recent, working NodeJS environment so that `npx` and `npm` are available in `PATH`. Also `make` and of course `wg` (from [wireguard tools](https://www.wireguard.com/install/)) must be there.

### Select and configure provider

As for any CDK application you will need to configure the

The `provider` context determines which cloud provider is being used. Currently supported:

- `hetzner`, requires additionally `hcloudToken` in context
- `digitalocean`, requires additionally `digitalOceanToken` in context

You can set the context values either by creating `stack/provider.json` or by exporting them in `CDKTF_CONTEXT_<name>` environment variables:

```json
{
  "provider": "hetzner",
  "hcloudToken": "my-token.."
}
```

or

```shell
export CDKTF_CONTEXT_provider=hetzner
export CDKTF_CONTEXT_hcloudToken=my-token...
```

or a mixture of both variants.

**Note**: Find all configurable context in [`stack/main.ts`](stack/main.ts). Unless specified otherwise, servers are started in German locations at smallest available sizes - I hope.

### Start VPN

```shell
$ make up
Deploying Stack: VpnStack
Resources
 ✔ CLOUDINIT_CONFIG     WireguardCloudInit  cloudinit_config.WireguardCloudInit
 ✔ HCLOUD_SERVER        VpnServer           hcloud_server.VpnServer
 ✔ HCLOUD_SSH_KEY       SshKey              hcloud_ssh_key.SshKey

Summary: 3 created, 0 updated, 0 destroyed.

Output: client-vpn-address = 192.168.123.10/24
        server-id = 16498950
        server-ip = 123.123.123.123
        server-status = running
        server-vpn-network = 192.168.123.1/24
        server-vpn-port = 51397

Use private key for client: 123abc345ABC...AB=
Use public key for server:  678xyz789XYZ...XZ=
```

With the above, you can create your local wireguard client configuration file. For the above output it would look like:

```conf
[Interface]
PrivateKey = 123abc345ABC...AB=
Address = 192.168.123.10/24
DNS = 1.1.1.1, 8.8.8.8

[Peer]
PublicKey = 678xyz789XYZ...XZ=
AllowedIPs = 0.0.0.0/0
Endpoint = 123.123.123.123:51397
```

**Note**: The first execution creates the server and client key files in the `keys/` sub-directory, where you can find them at any time later.

### Stop VPN server

```
$ make down
Destroying Stack: VpnStack
Resources
 ✔ CLOUDINIT_CONFIG     WireguardCloudInit  cloudinit_config.WireguardCloudInit
 ✔ HCLOUD_SERVER        VpnServer           hcloud_server.VpnServer
 ✔ HCLOUD_SSH_KEY       SshKey              hcloud_ssh_key.SshKey

Summary: 3 destroyed.
```

## Structure

- `/`: Makefile and README to document all commands
- `stack/`: all Terraform CDK related code
- `keys/`: all private and public keys used

## Resources

- [Terraform CDK: Getting started with TypeScript](https://github.com/hashicorp/terraform-cdk/blob/main/docs/getting-started/typescript.md)
- [Wireguard Quick Start](https://www.wireguard.com/quickstart/)
- [How To Set Up WireGuard Firewall Rules in Linux](https://www.cyberciti.biz/faq/how-to-set-up-wireguard-firewall-rules-in-linux/)
- [How to configure a WireGuard macOS client](https://serversideup.net/how-to-configure-a-wireguard-macos-client/)
