import { Construct } from "constructs";
import * as cloudinit from "../.gen/providers/cloudinit";

const defaultServerAddress = "192.168.6.1/24";
const defaultServerPort = "51397";
const defaultClientAddress = "192.168.6.10/24";
const defaultSshUser = "ubuntu";

export interface WireguardServerProps {
  vpnServerAddress?: string;
  vpnServerPort?: string;
  vpnServerPrivateKey: string;
  vpnClientPublicKey: string;
  vpnClientAddress?: string;
  sshUser?: string;
}

export interface WireguardCloudInitProps extends WireguardServerProps {
  sshKey: string;
  base64Encode?: boolean;
}

export class WireguardCloudInit extends cloudinit.Config {
  public serverAddress: string;
  public serverPort: string;
  public clientAddress: string;
  public sshUser: string;

  constructor(scope: Construct, name: string, props: WireguardCloudInitProps) {
    super(scope, name, {
      base64Encode: props.base64Encode ?? true,
      gzip: props.base64Encode ?? true,
      part: [
        {
          contentType: "text/cloud-config",
          content: `#cloud-config
apt_upgrade: true
packages:
  - wireguard`,
        },
        {
          contentType: "text/x-shellscript",
          content: `#!/bin/bash

mkdir -p /etc/wireguard
cd /etc/wireguard

umask 077

cat > wg0.conf <<- EOF
[Interface]
Address = ${props.vpnServerAddress ?? defaultServerAddress}
ListenPort = ${props.vpnServerPort ?? defaultServerPort}
PrivateKey = ${props.vpnServerPrivateKey}
PostUp = iptables -A FORWARD -i %i -j ACCEPT; iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE
PostDown = iptables -D FORWARD -i %i -j ACCEPT; iptables -t nat -D POSTROUTING -o eth0 -j MASQUERADE

[Peer]
PublicKey = ${props.vpnClientPublicKey}
AllowedIPs = ${props.vpnClientAddress ?? defaultClientAddress}
EOF

umask 022
sysctl -w net.ipv4.ip_forward=1
echo "net.ipv4.ip_forward = 1" >> /etc/sysctl.d/forwarding.conf

systemctl enable wg-quick@wg0
systemctl start wg-quick@wg0`,
        },
        {
          contentType: "text/cloud-config",
          content: `#cloud-config
disable_root: 1
ssh_pwauth: 0
groups:
  - ${props.sshUser ?? defaultSshUser}
users:
  - name: ${props.sshUser ?? defaultSshUser}
    sudo: ALL=(ALL) NOPASSWD:ALL
    primary_group: ${props.sshUser ?? defaultSshUser}
    groups: users
    lock_passwd: true
    ssh_authorized_keys:
      - ${props.sshKey}
runcmd:
  - ufw allow OpenSSH
  - ufw allow ${props.vpnServerPort ?? defaultServerPort}/udp
  - ufw enable
`,
        },
      ],
    });

    this.serverAddress = props.vpnServerAddress ?? defaultServerAddress;
    this.serverPort = props.vpnServerAddress ?? defaultServerPort;
    this.clientAddress = props.vpnClientAddress ?? defaultClientAddress;
    this.sshUser = props.sshUser ?? defaultSshUser;
  }
}
