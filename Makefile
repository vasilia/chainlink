.DEFAULT_GOAL := build
.PHONY: godep yarndep build install gui docker dockerpush

ENVIRONMENT ?= release

REPO := smartcontract/chainlink
COMMIT_SHA ?= $(shell git rev-parse HEAD)
VERSION = $(shell cat VERSION)
GO_LDFLAGS := $(shell tools/bin/ldflags)
GOFLAGS = -ldflags "$(GO_LDFLAGS)"
DOCKERFILE := Dockerfile
DOCKER_TAG ?= latest

# SGX is disabled by default, but turned on when building from Docker
SGX_ENABLED ?= no
SGX_SIMULATION ?= yes
SGX_ENCLAVE := enclave.signed.so
SGX_TARGET := ./sgx/target/$(ENVIRONMENT)/

ifneq (,$(filter yes true,$(SGX_ENABLED)))
	GOFLAGS += -tags=sgx_enclave
	SGX_BUILD_ENCLAVE := $(SGX_ENCLAVE)
	DOCKERFILE := Dockerfile-sgx
	REPO := $(REPO)-sgx
else
	SGX_BUILD_ENCLAVE :=
endif

TAGGED_REPO := $(REPO):$(DOCKER_TAG)

godep: ## Ensure chainlink's go dependencies are installed.
	@if [ -z "`which dep`" ]; then \
		go get github.com/golang/dep/cmd/dep; \
	fi || true
	@if [ -z "`which gencodec`" ]; then \
		go get github.com/smartcontractkit/gencodec; \
	fi || true
	dep ensure -vendor-only

yarndep: ## Ensure the frontend's dependencies are installed.
	yarn install --frozen-lockfile

install: godep gui $(SGX_BUILD_ENCLAVE) ## Install chainlink
	cd core && go build -i -o $(GOPATH)/bin/chainlink $(GOFLAGS)

gui: yarndep ## Install GUI
	cd gui && rm -rf dist && CHAINLINK_VERSION="$(VERSION)@$(COMMIT_SHA)" yarn build
	CGO_ENABLED=0 go run gui/main.go "${CURDIR}/core/services"

docker: ## Build the docker image.
	docker build \
		--build-arg ENVIRONMENT=$(ENVIRONMENT) \
		--build-arg COMMIT_SHA=$(COMMIT_SHA) \
		--build-arg SGX_SIMULATION=$(SGX_SIMULATION) \
		-t $(TAGGED_REPO) \
		-f $(DOCKERFILE) \
		.

dockerpush: ## Push the docker image to dockerhub
	docker push $(TAGGED_REPO)

chainlink: $(SGX_BUILD_ENCLAVE)
	CGO_ENABLED=0 go run gui/main.go "${CURDIR}/store"
	go build $(GOFLAGS) -o chainlink

.PHONY: $(SGX_ENCLAVE)
$(SGX_ENCLAVE):
	@ENVIRONMENT=$(ENVIRONMENT) SGX_ENABLED=$(SGX_ENABLED) SGX_SIMULATION=$(SGX_SIMULATION) make -C sgx/
	@ln -f $(SGX_TARGET)/libadapters.so sgx/target/libadapters.so

.PHONY: enclave
enclave: $(SGX_ENCLAVE)

help:
	@echo ""
	@echo "         .__           .__       .__  .__        __"
	@echo "    ____ |  |__ _____  |__| ____ |  | |__| ____ |  | __"
	@echo "  _/ ___\|  |  \\\\\\__  \ |  |/    \|  | |  |/    \|  |/ /"
	@echo "  \  \___|   Y  \/ __ \|  |   |  \  |_|  |   |  \    <"
	@echo "   \___  >___|  (____  /__|___|  /____/__|___|  /__|_ \\"
	@echo "       \/     \/     \/        \/             \/     \/"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'
