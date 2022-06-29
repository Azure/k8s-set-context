import * as core from '@actions/core'
import * as path from 'path'
import * as fs from 'fs'
import {Cluster, parseCluster} from './types/cluster'
import {setContext, getKubeconfig, kubeLogin, azSetContext} from './utils'

/**
 * Sets the Kubernetes context based on supplied action inputs
 */
export async function run() {
   // get inputs
   const useKubeLoginInput: string = core.getInput('use-kubelogin')
   const useKubeLogin: boolean = useKubeLoginInput.toLowerCase() === 'true' && !admin
   const useAZSetContextInput: string = core.getInput('use-aks-set-context')
   const useAZSetContext: boolean = useAZSetContextInput.toLocaleLowerCase() === 'true'
   let exitCode: number

   const clusterType: Cluster | undefined = parseCluster(
      core.getInput('cluster-type', {
         required: true
      })
   )
   const runnerTempDirectory: string = process.env['RUNNER_TEMP']
   const kubeconfigPath: string = path.join(
      runnerTempDirectory,
      `kubeconfig_${Date.now()}`
   )

   // get kubeconfig and update context
   
   if(useAZSetContext){
      exitCode = await azSetContext(kubeconfigPath)
      if(exitCode !== 0) throw Error('az cli exited with error code ' + exitCode)
   } else {
      const kubeconfig: string = await getKubeconfig(clusterType)
      const kubeconfigWithContext: string = setContext(kubeconfig)
      // output kubeconfig
      core.debug(`Writing kubeconfig contents to ${kubeconfigPath}`)
      fs.writeFileSync(kubeconfigPath, kubeconfigWithContext)
   }
   
   fs.chmodSync(kubeconfigPath, '600')
   core.debug('Setting KUBECONFIG environment variable')
   core.exportVariable('KUBECONFIG', kubeconfigPath)

   if(azSetContext && useKubeLogin){
      kubeLogin(exitCode)
   }
}

// Run the application
run().catch(core.setFailed)
