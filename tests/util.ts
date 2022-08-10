/**
 * Returns error thrown by core.getInput when input required but not found
 * @param inputName Name of input
 * @returns Error with explanation message
 */
export const getRequiredInputError = (inputName) =>
   Error(`Input required and not supplied: ${inputName}`)

export const getAzCommandError = () =>
   Error(
      'Az cli tools not installed. You must install them before running this action with the aks-set-context flag'
   )
