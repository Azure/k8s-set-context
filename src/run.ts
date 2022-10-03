import * as core from '@actions/core'
import * as path from 'path'
import * as fs from 'fs'
import {Cluster, parseCluster} from './types/cluster'
import {setContext, getKubeconfig, setKubeconfigPath} from './utils'

/**
 * Sets the Kubernetes context based on supplied action inputs
 */

export async function run() {
   const runnerTempDirectory: string = process.env['RUNNER_TEMP']
   const kubeconfigPath: string = path.join(
      runnerTempDirectory,
      `kubeconfig_${Date.now()}`
   )

   const clusterType: Cluster | undefined = parseCluster(
      core.getInput('cluster-type', {
         required: true
      })
   )

   const kubeconfig: string = await getKubeconfig(clusterType)
   const kubeconfigWithContext: string = setContext(kubeconfig)
   // output kubeconfig
   core.debug(`Writing kubeconfig contents to ${kubeconfigPath}`)
   fs.writeFileSync(kubeconfigPath, kubeconfigWithContext)
   setKubeconfigPath(kubeconfigPath)
}

// Run the application
run().catch(core.setFailed)
