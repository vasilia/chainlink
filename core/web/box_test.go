package web_test

import (
	"os"
	"strings"
	"testing"

	"github.com/smartcontractkit/chainlink/core/web"
	"github.com/stretchr/testify/assert"
)

func TestBox_MatchWildcardBoxPath(t *testing.T) {
	t.Parallel()

	rootIndex := "index.html"
	jobSpecRunShowRouteInfo := strings.Join(
		[]string{"job_specs", "_jobSpecId_", "runs", "_jobSpecRunId_", "routeInfo.json"},
		(string)(os.PathSeparator),
	)
	boxList := []string{rootIndex, jobSpecRunShowRouteInfo}

	assert.Equal(
		t,
		rootIndex,
		web.MatchWildcardBoxPath(boxList, "/", "index.html"),
	)
	assert.Equal(
		t,
		"",
		web.MatchWildcardBoxPath(boxList, "/", "not_found.html"),
	)

	assert.Equal(
		t,
		jobSpecRunShowRouteInfo,
		web.MatchWildcardBoxPath(boxList, "/jobs/abc123/runs/abc123", "routeInfo.json"),
	)
	assert.Equal(
		t,
		"",
		web.MatchWildcardBoxPath(boxList, "/jobs/abc123/runs/abc123", "notFound.json"),
	)
	assert.Equal(
		t,
		jobSpecRunShowRouteInfo,
		web.MatchWildcardBoxPath(boxList, "/jobs/1be8102f144945ce946a3d478524da40/runs/id/9e8e1dc70d0f49b6a9335b769c1d33d8", "notFound.json"),
	)
}

func TestBox_MatchExactBoxPath(t *testing.T) {
	t.Parallel()

	main := "main.js"
	pageMain := strings.Join([]string{"page", "main.js"}, (string)(os.PathSeparator))
	boxList := []string{main, pageMain}

	assert.Equal(t, main, web.MatchExactBoxPath(boxList, "/main.js"))
	assert.Equal(t, "", web.MatchExactBoxPath(boxList, "/not_found.js"))

	assert.Equal(t, pageMain, web.MatchExactBoxPath(boxList, "/page/main.js"))
	assert.Equal(t, "", web.MatchExactBoxPath(boxList, "/ppage/main.js"))
	assert.Equal(t, "", web.MatchExactBoxPath(boxList, "/page/not_found.js"))
}
