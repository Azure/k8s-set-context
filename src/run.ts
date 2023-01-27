import {run} from './action'
import * as core from '@actions/core'

// Run the application
run().catch(core.setFailed)
