import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  database: {
    // Recipes
    getRecipes: () => ipcRenderer.invoke('get-recipes'),
    getRecipeById: (id) => ipcRenderer.invoke('get-recipe-by-id', id),
    addRecipe: (recipeData) => ipcRenderer.invoke('add-recipe', recipeData),
    updateRecipe: (id, recipeData) => ipcRenderer.invoke('update-recipe', id, recipeData),
    deleteRecipe: (id) => ipcRenderer.invoke('delete-recipe', id),

    // Ingredients
    getIngredients: () => ipcRenderer.invoke('get-ingredients'),
    getIngredientById: (id) => ipcRenderer.invoke('get-ingredient-by-id', id),
    addIngredient: (ingredientData) => ipcRenderer.invoke('add-ingredient', ingredientData),
    updateIngredient: (id, ingredientData) => ipcRenderer.invoke('update-ingredient', id, ingredientData),
    deleteIngredient: (id) => ipcRenderer.invoke('delete-ingredient', id),
    getLowStockIngredients: () => ipcRenderer.invoke('get-low-stock-ingredients'),
    updateIngredientStock: (id, quantity, operation) => 
      ipcRenderer.invoke('update-ingredient-stock', id, quantity, operation),
    getIngredientUsage: (ingredientId, startDate, endDate) => 
      ipcRenderer.invoke('get-ingredient-usage', ingredientId, startDate, endDate),

    // Recipe Ingredients
    getRecipeIngredients: (recipeId) => 
      ipcRenderer.invoke('get-recipe-ingredients', recipeId),
    addRecipeIngredient: (recipeIngredientData) => 
      ipcRenderer.invoke('add-recipe-ingredient', recipeIngredientData),
    updateRecipeIngredient: (recipeId, ingredientId, updateData) => 
      ipcRenderer.invoke('update-recipe-ingredient', recipeId, ingredientId, updateData),
    deleteRecipeIngredient: (recipeId, ingredientId) => 
      ipcRenderer.invoke('delete-recipe-ingredient', recipeId, ingredientId),
    getRecipesByIngredient: (ingredientId) => 
      ipcRenderer.invoke('get-recipes-by-ingredient', ingredientId),
    checkRecipeIngredientsAvailability: (recipeId, multiplier) => 
      ipcRenderer.invoke('check-recipe-ingredients-availability', recipeId, multiplier),

    // Operators
    getOperators: () => ipcRenderer.invoke('get-operators'),
    getOperatorById: (id) => ipcRenderer.invoke('get-operator-by-id', id),
    addOperator: (operatorData) => ipcRenderer.invoke('add-operator', operatorData),
    updateOperator: (id, operatorData) => ipcRenderer.invoke('update-operator', id, operatorData),
    deleteOperator: (id) => ipcRenderer.invoke('delete-operator', id),

    // Production Lines
    getProductionLines: () => ipcRenderer.invoke('get-production-lines'),
    getProductionLineById: (id) => ipcRenderer.invoke('get-production-line-by-id', id),
    addProductionLine: (lineData) => ipcRenderer.invoke('add-production-line', lineData),
    updateProductionLine: (id, lineData) => 
      ipcRenderer.invoke('update-production-line', id, lineData),
    deleteProductionLine: (id) => ipcRenderer.invoke('delete-production-line', id),

    // Production Processes
    getProductionProcesses: () => ipcRenderer.invoke('get-production-processes'),
    getProductionProcessById: (id) => ipcRenderer.invoke('get-production-process-by-id', id),
    addProductionProcess: (processData) => ipcRenderer.invoke('add-production-process', processData),
    updateProductionProcess: (id, processData) => 
      ipcRenderer.invoke('update-production-process', id, processData),
    deleteProductionProcess: (id) => ipcRenderer.invoke('delete-production-process', id),
    getActiveProcesses: () => ipcRenderer.invoke('get-active-processes'),
    getProcessesByDateRange: (startDate, endDate) => 
      ipcRenderer.invoke('get-processes-by-date-range', startDate, endDate),

    // Process Steps
    getProcessSteps: (recipeId) => ipcRenderer.invoke('get-process-steps', recipeId),
    addProcessStep: (stepData) => ipcRenderer.invoke('add-process-step', stepData),
    updateProcessStep: (id, stepData) => ipcRenderer.invoke('update-process-step', id, stepData),
    deleteProcessStep: (id) => ipcRenderer.invoke('delete-process-step', id),

    // Process Events
    getProcessEvents: (processId) => ipcRenderer.invoke('get-process-events', processId),
    addProcessEvent: (eventData) => ipcRenderer.invoke('add-process-event', eventData),
    deleteProcessEvent: (id) => ipcRenderer.invoke('delete-process-event', id),

    // Quality Checks
    getQualityChecks: (processId) => ipcRenderer.invoke('get-quality-checks', processId),
    addQualityCheck: (checkData) => ipcRenderer.invoke('add-quality-check', checkData),
    updateQualityCheck: (id, checkData) => 
      ipcRenderer.invoke('update-quality-check', id, checkData),

    // Process Ingredients
    getProcessIngredients: (processId) => ipcRenderer.invoke('get-process-ingredients', processId),
    addProcessIngredient: (ingredientData) => 
      ipcRenderer.invoke('add-process-ingredient', ingredientData),
    updateProcessIngredient: (processId, ingredientId, updateData) => 
      ipcRenderer.invoke('update-process-ingredient', processId, ingredientId, updateData)
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  window.electron = electronAPI
  window.api = api
}
