import * as core from "@actions/core";
import * as path from "path";
import * as fs from "fs";
import * as io from "@actions/io";
import * as toolCache from "@actions/tool-cache";
import * as os from "os";
import { ToolRunner } from "@actions/exec/lib/toolrunner";
import * as jsyaml from "js-yaml";
import * as util from "util";
import { ClusterType, parseClusterType } from "./constants";

async function run() {
  const clusterType: ClusterType = parseClusterType(
    core.getInput("cluster-type", {
      required: true,
    })
  );
}

run().catch(core.setFailed);
