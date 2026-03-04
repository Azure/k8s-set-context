/**
 * Returns error thrown by core.getInput when input required but not found
 * @param inputName Name of input
 * @returns Error with explanation message
 */
export const getRequiredInputError = (inputName: string): Error =>
   Error(`Input required and not supplied: ${inputName}`)
