.DEFAULT_GOAL: up

keys/server.priv:
	wg genkey > $@

keys/server.pub: keys/server.priv
	cat $< | wg pubkey > $@

keys/client.priv:
	wg genkey > $@

keys/client.pub: keys/client.priv
	cat $< | wg pubkey > $@

.PHONY:
genkeys: keys/server.pub keys/client.pub

stack/node_modules:
	@cd stack && npm install

stack/.gen/providers:
	@cd stack && npx cdktf get

.PHONY: up
up: genkeys stack/node_modules stack/.gen/providers
	@cd stack && \
		CDKTF_CONTEXT_vpnServerPrivateKey=$$(cat ../keys/server.priv) \
		CDKTF_CONTEXT_vpnClientPublicKey=$$(cat ../keys/client.pub) \
		CDKTF_RUNTIME_CONTEXT_FILE=$$([ -f provider.json ] && echo provider.json) \
		npx cdktf deploy && \
		echo && \
		echo "Use private key for client: $$(cat ../keys/client.priv)" && \
		echo "Use public key for server:  $$(cat ../keys/server.pub)"

.PHONY: down
down: stack/node_modules stack/.gen/providers
	@cd stack && \
		CDKTF_CONTEXT_vpnServerPrivateKey=$$(cat ../keys/server.priv) \
		CDKTF_CONTEXT_vpnClientPublicKey=$$(cat ../keys/client.pub) \
		CDKTF_RUNTIME_CONTEXT_FILE=$$([ -f provider.json ] && echo provider.json) \
		npx cdktf destroy
