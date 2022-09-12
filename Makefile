update:
	git submodule update --init --remote
	cd bakalariStalkin; npm i
	npm i
	node deploy-commands
