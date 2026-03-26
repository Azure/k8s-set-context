import {run} from './action.js'
import * as core from '@actions/core'

// Run the application
run().catch(core.setFailed)
