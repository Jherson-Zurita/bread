import { app, shell, BrowserWindow, ipcMain,dialog } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import sqlite3 from 'sqlite3'
import { join as pathJoin } from 'path'
import db from '../renderer/src/database/database'
const fs = require('fs');
const fss = require('fs-extra');
const path = require('path');

function setupRecipeHandlers() {
  // Ejemplo de consulta de recetas
  ipcMain.handle('get-recipes', async () => {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM recipes', [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  });

  ipcMain.handle('get-recipe-by-id', async (_, id) => {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM recipes WHERE id = ?', [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  });

  // Ejemplo de insertar una receta
  ipcMain.handle('add-recipe', async (_, recipeData) => {
    return new Promise((resolve, reject) => {
      const { name, category, base_quantity, base_unit, estimated_time,active } = recipeData;
      db.run(
        'INSERT INTO recipes (name, category, base_quantity, base_unit, estimated_time,active) VALUES (?, ?, ?, ?, ?,?)',
        [name, category, base_quantity, base_unit, estimated_time,active],
        function (err) {
          if (err) reject(err);
          else resolve({ id: this.lastID });
        }
      );
    });
  });

  // Ejemplo de actualizar una receta
  ipcMain.handle('update-recipe', async (_, recipeData) => {
    return new Promise((resolve, reject) => {
      const { id, name, category, base_quantity, base_unit, estimated_time, active } = recipeData;
      db.run(
        `UPDATE recipes SET name = ?, category = ?, base_quantity = ?, base_unit = ?, estimated_time = ?, active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [name, category, base_quantity, base_unit, estimated_time, active, id],
        function (err) {
          if (err) reject(err);
          else resolve({ changes: this.changes });
        }
      );
    });
  });

  // Ejemplo de eliminar una receta
  ipcMain.handle('delete-recipe', async (_, recipeId) => {
    return new Promise((resolve, reject) => {
      db.run(
        `DELETE FROM recipes WHERE id = ?`,
        [recipeId],
        function (err) {
          if (err) reject(err);
          else resolve({ changes: this.changes });
        }
      );
    });
  });

  // Agrega más manejadores según necesites
}

// Funciones adicionales para Ingredients
function setupIngredientHandlers() {
  // ... (mantener las funciones CRUD básicas que ya teníamos)
  ipcMain.handle('get-ingredients', async () => {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM ingredients', [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  });
  ipcMain.handle('get-ingredient-by-id', async (_, id) => {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM ingredients WHERE id = ?', [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  });
  ipcMain.handle('add-ingredient', async (_, ingredientData) => {
    return new Promise((resolve, reject) => {
      const { name, current_stock, unit, min_stock, alert_percentage } = ingredientData;
      db.run(
        'INSERT INTO ingredients (name, current_stock, unit, min_stock, alert_percentage) VALUES (?, ?, ?, ?, ?)',
        [name, current_stock, unit, min_stock, alert_percentage],
        function (err) {
          if (err) reject(err);
          else resolve({ id: this.lastID });
        }
      );
    });
  });
  ipcMain.handle('update-ingredient', async (_, ingredientData) => {
    return new Promise((resolve, reject) => {
      const { id, name, current_stock, unit, min_stock, alert_percentage } = ingredientData;
      db.run(
        `UPDATE ingredients SET name = ?, current_stock = ?, unit = ?, min_stock = ?, alert_percentage = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [name, current_stock, unit, min_stock, alert_percentage, id],
        function (err) {
          if (err) reject(err);
          else resolve({ changes: this.changes });
        }
      );
    });
  });
  ipcMain.handle('delete-ingredient', async (_, ingredientId) => {
    return new Promise((resolve, reject) => {
      db.run(
        `DELETE FROM ingredients WHERE id = ?`,
        [ingredientId],
        function (err) {
          if (err) reject(err);
          else resolve({ changes: this.changes });
        }
      );
    });
  });
  // Obtener ingredientes con stock bajo
  ipcMain.handle('get-low-stock-ingredients', async () => {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT *
         FROM ingredients
         WHERE current_stock <= min_stock
         OR current_stock <= (min_stock * (1 + alert_percentage/100.0))`,
        [],
        (err, rows) => {
          if (err) reject(err)
          else resolve(rows)
        }
      )
    })
  })

  // Actualizar el stock de un ingrediente
  ipcMain.handle('update-ingredient-stock', async (_, id, quantity, operation) => {
    return new Promise((resolve, reject) => {
      let updateQuery = ''
      if (operation === 'add') {
        updateQuery = 'UPDATE ingredients SET current_stock = current_stock + ? WHERE id = ?'
      } else if (operation === 'subtract') {
        updateQuery = 'UPDATE ingredients SET current_stock = current_stock - ? WHERE id = ?'
      } else {
        updateQuery = 'UPDATE ingredients SET current_stock = ? WHERE id = ?'
      }

      db.run(updateQuery, [quantity, id], function (err) {
        if (err) reject(err)
        else resolve({ changes: this.changes })
      })
    })
  })

  // Obtener historial de uso de un ingrediente
  ipcMain.handle('get-ingredient-usage', async (_, ingredientId, startDate, endDate) => {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT p.batch_number, p.start_time, pi.used_quantity, pi.unit,
                r.name as recipe_name
         FROM process_ingredients pi
         JOIN production_processes p ON pi.process_id = p.id
         JOIN recipes r ON p.recipe_id = r.id
         WHERE pi.ingredient_id = ?
         AND p.start_time BETWEEN ? AND ?
         ORDER BY p.start_time DESC`,
        [ingredientId, startDate, endDate],
        (err, rows) => {
          if (err) reject(err)
          else resolve(rows)
        }
      )
    })
  })

  // Verificar si hay suficiente stock para una receta
  ipcMain.handle('check-recipe-ingredients-availability', async (_, recipeId, multiplier = 1) => {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT i.name, i.current_stock, i.unit as stock_unit,
                ri.quantity * ? as required_quantity, ri.unit as recipe_unit
         FROM recipe_ingredients ri
         JOIN ingredients i ON ri.ingredient_id = i.id
         WHERE ri.recipe_id = ?`,
        [multiplier, recipeId],
        (err, rows) => {
          if (err) reject(err);
          else {
            const ingredientsCheck = rows.map(row => ({
              name: row.name,
              available: row.current_stock >= row.required_quantity,
              current_stock: row.current_stock,
              required_quantity: row.required_quantity,
              unit: row.stock_unit
            }));

            // Verifica si todos los ingredientes están disponibles
            const allAvailable = ingredientsCheck.every(ing => ing.available);
            
            resolve({
              available: allAvailable,
              ingredients: ingredientsCheck,
              message: allAvailable ? 
                'Todos los ingredientes están disponibles' : 
                'No hay suficientes ingredientes disponibles'
            });
          }
        }
      )
    })
});
}

// Funciones para Recipe Ingredients
function setupRecipeIngredientHandlers() {
  // Obtener todos los ingredientes de una receta
  ipcMain.handle('get-recipe-ingredients', async (_, recipeId) => {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT ri.*, i.name as ingredient_name, i.current_stock, i.unit as stock_unit
        FROM recipe_ingredients ri
        JOIN ingredients i ON ri.ingredient_id = i.id
        WHERE ri.recipe_id = ?
      `;
      db.all(query, [recipeId], (err, rows) => {
        if (err) {
          console.error('Database error:', err);
          reject(err);
        } else {
          console.log('Query results:', rows);
          resolve(rows);
        }
      });
    });
  });

  // Agregar un ingrediente a una receta
  ipcMain.handle('add-recipe-ingredient', async (_, recipeIngredientData) => {
    return new Promise((resolve, reject) => {
      const { recipe_id, ingredient_id, quantity, unit } = recipeIngredientData
      db.run(
        'INSERT INTO recipe_ingredients (recipe_id, ingredient_id, quantity, unit) VALUES (?, ?, ?, ?)',
        [recipe_id, ingredient_id, quantity, unit],
        function (err) {
          if (err) reject(err)
          else resolve({ success: true })
        }
      )
    })
  })

  // Actualizar un ingrediente de una receta
  ipcMain.handle('update-recipe-ingredient', async (_, recipeId, ingredientId, updateData) => {
    return new Promise((resolve, reject) => {
      const { quantity, unit } = updateData
      db.run(
        'UPDATE recipe_ingredients SET quantity = ?, unit = ? WHERE recipe_id = ? AND ingredient_id = ?',
        [quantity, unit, recipeId, ingredientId],
        function (err) {
          if (err) reject(err)
          else resolve({ changes: this.changes })
        }
      )
    })
  })

  // Eliminar un ingrediente de una receta
  ipcMain.handle('delete-recipe-ingredient', async (_, recipeId, ingredientId) => {
    return new Promise((resolve, reject) => {
      db.run(
        'DELETE FROM recipe_ingredients WHERE recipe_id = ? AND ingredient_id = ?',
        [recipeId, ingredientId],
        function (err) {
          if (err) reject(err)
          else resolve({ changes: this.changes })
        }
      )
    })
  })

  // Obtener todas las recetas que usan un ingrediente específico
  ipcMain.handle('get-recipes-by-ingredient', async (_, ingredientId) => {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT r.*, ri.quantity, ri.unit
         FROM recipes r
         JOIN recipe_ingredients ri ON r.id = ri.recipe_id
         WHERE ri.ingredient_id = ?`,
        [ingredientId],
        (err, rows) => {
          if (err) reject(err)
          else resolve(rows)
        }
      )
    })
  })
}

// Funciones para Operators
function setupOperatorHandlers() {
  ipcMain.handle('get-operators', async () => {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM operators', [], (err, rows) => {
        if (err) reject(err)
        else resolve(rows)
      })
    })
  })

  ipcMain.handle('get-operator-by-id', async (_, id) => {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM operators WHERE id = ?', [id], (err, row) => {
        if (err) reject(err)
        else resolve(row)
      })
    })
  })

  ipcMain.handle('add-operator', async (_, operatorData) => {
    return new Promise((resolve, reject) => {
      const { name, active } = operatorData
      db.run(
        'INSERT INTO operators (name, active) VALUES (?, ?)',
        [name, active],
        function (err) {
          if (err) reject(err)
          else resolve({ id: this.lastID })
        }
      )
    })
  })

  ipcMain.handle('update-operator', async (_, id, operatorData) => {
    return new Promise((resolve, reject) => {
      const { name, active } = operatorData
      db.run(
        'UPDATE operators SET name = ?, active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [name, active, id],
        function (err) {
          if (err) reject(err)
          else resolve({ changes: this.changes })
        }
      )
    })
  })

  ipcMain.handle('delete-operator', async (_, id) => {
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM operators WHERE id = ?', [id], function (err) {
        if (err) reject(err)
        else resolve({ changes: this.changes })
      })
    })
  })
}

// Funciones para Production Lines
function setupProductionLineHandlers() {
  ipcMain.handle('get-production-lines', async () => {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM production_lines', [], (err, rows) => {
        if (err) reject(err)
        else resolve(rows)
      })
    })
  })

  ipcMain.handle('get-production-line-by-id', async (_, id) => {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM production_lines WHERE id = ?', [id], (err, row) => {
        if (err) reject(err)
        else resolve(row)
      })
    })
  })

  ipcMain.handle('add-production-line', async (_, lineData) => {
    return new Promise((resolve, reject) => {
      const { name, active } = lineData
      db.run(
        'INSERT INTO production_lines (name, active) VALUES (?, ?)',
        [name, active],
        function (err) {
          if (err) reject(err)
          else resolve({ id: this.lastID })
        }
      )
    })
  })

  ipcMain.handle('update-production-line', async (_, id, lineData) => {
    return new Promise((resolve, reject) => {
      const { name, active } = lineData
      db.run(
        'UPDATE production_lines SET name = ?, active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [name, active, id],
        function (err) {
          if (err) reject(err)
          else resolve({ changes: this.changes })
        }
      )
    })
  })

  ipcMain.handle('delete-production-line', async (_, id) => {
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM production_lines WHERE id = ?', [id], function (err) {
        if (err) reject(err)
        else resolve({ changes: this.changes })
      })
    })
  })
}

// Funciones para Production Processes
function setupProductionProcessHandlers() {
  ipcMain.handle('get-production-processes', async () => {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM production_processes', [], (err, rows) => {
        if (err) reject(err)
        else resolve(rows)
      })
    })
  })

  ipcMain.handle('get-production-process-by-id', async (_, id) => {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM production_processes WHERE id = ?', [id], (err, row) => {
        if (err) reject(err)
        else resolve(row)
      })
    })
  })

  ipcMain.handle('add-production-process', async (_, processData) => {
    return new Promise((resolve, reject) => {
      const {
        batch_number,
        recipe_id,
        operator_id,
        line_id,
        quantity,
        unit,
        start_time,
        estimated_end_time,
        status,
        priority,
        temperature,
        humidity
      } = processData

      db.run(
        `INSERT INTO production_processes (
          batch_number, recipe_id, operator_id, line_id, quantity, unit,
          start_time, estimated_end_time, status, priority, temperature, humidity
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          batch_number, recipe_id, operator_id, line_id, quantity, unit,
          start_time, estimated_end_time, status, priority, temperature, humidity
        ],
        function (err) {
          if (err) reject(err)
          else resolve({ id: this.lastID })
        }
      )
    })
  })

  ipcMain.handle('update-production-process', async (_, id, processData) => {
    return new Promise((resolve, reject) => {
      const {
        status,
        progress,
        actual_end_time,
        temperature,
        humidity
      } = processData

      db.run(
        `UPDATE production_processes 
         SET status = ?, progress = ?, actual_end_time = ?, 
             temperature = ?, humidity = ?
         WHERE id = ?`,
        [status, progress, actual_end_time, temperature, humidity, id],
        function (err) {
          if (err) reject(err)
          else resolve({ changes: this.changes })
        }
      )
    })
  })

  ipcMain.handle('delete-production-process', async (_, id) => {
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM production_processes WHERE id = ?', [id], function (err) {
        if (err) reject(err)
        else resolve({ changes: this.changes })
      })
    })
  })

  // Consultas específicas para procesos de producción
  ipcMain.handle('get-active-processes', async () => {
    return new Promise((resolve, reject) => {
      db.all(
        "SELECT * FROM production_processes WHERE status NOT IN ('completed', 'cancelled')",
        [],
        (err, rows) => {
          if (err) reject(err)
          else resolve(rows)
        }
      )
    })
  })

  ipcMain.handle('get-processes-by-date-range', async (_, startDate, endDate) => {
    return new Promise((resolve, reject) => {
      db.all(
        'SELECT * FROM production_processes WHERE start_time BETWEEN ? AND ?',
        [startDate, endDate],
        (err, rows) => {
          if (err) reject(err)
          else resolve(rows)
        }
      )
    })
  })
}

// Funciones para Process Steps
function setupProcessStepHandlers() {
  ipcMain.handle('get-process-steps', async (_, recipeId) => {
    return new Promise((resolve, reject) => {
      db.all(
        'SELECT * FROM process_steps WHERE recipe_id = ? ORDER BY step_number',
        [recipeId],
        (err, rows) => {
          if (err) reject(err)
          else resolve(rows)
        }
      )
    })
  })

  ipcMain.handle('add-process-step', async (_, stepData) => {
    return new Promise((resolve, reject) => {
      const { recipe_id, step_number, title, description, estimated_time } = stepData
      //console.log('data: ' + JSON.stringify(stepData));
      db.run(
        'INSERT INTO process_steps (recipe_id, step_number, title, description, estimated_time) VALUES (?, ?, ?, ?, ?)',
        [recipe_id, step_number, title, description, estimated_time],
        function (err) {
          if (err) reject(err)
          else resolve({ id: this.lastID })
        }
      )
    })
  })

  ipcMain.handle('update-process-step', async (_, id, stepData) => {
    return new Promise((resolve, reject) => {
      const { title, description, estimated_time } = stepData
      db.run(
        'UPDATE process_steps SET title = ?, description = ?, estimated_time = ? WHERE id = ?',
        [title, description, estimated_time, id],
        function (err) {
          if (err) reject(err)
          else resolve({ changes: this.changes })
        }
      )
    })
  })

  ipcMain.handle('delete-process-step', async (_, id) => {
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM process_steps WHERE id = ?', [id], function (err) {
        if (err) reject(err)
        else resolve({ changes: this.changes })
      })
    })
  })
}

// Funciones para Process Events
function setupProcessEventHandlers() {
  ipcMain.handle('get-process-events', async (_, processId) => {
    return new Promise((resolve, reject) => {
      db.all(
        'SELECT * FROM process_events WHERE process_id = ? ORDER BY event_time DESC',
        [processId],
        (err, rows) => {
          if (err) reject(err)
          else resolve(rows)
        }
      )
    })
  })

  ipcMain.handle('add-process-event', async (_, eventData) => {
    return new Promise((resolve, reject) => {
      const { process_id, event_time, description, status } = eventData
      db.run(
        'INSERT INTO process_events (process_id, event_time, description, status) VALUES (?, ?, ?, ?)',
        [process_id, event_time, description, status],
        function (err) {
          if (err) reject(err)
          else resolve({ id: this.lastID })
        }
      )
    })
  })

  ipcMain.handle('delete-process-event', async (_, id) => {
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM process_events WHERE id = ?', [id], function (err) {
        if (err) reject(err)
        else resolve({ changes: this.changes })
      })
    })
  })
}

// Funciones para Quality Checks
function setupQualityCheckHandlers() {
  ipcMain.handle('get-quality-checks', async (_, processId) => {
    return new Promise((resolve, reject) => {
      db.all(
        'SELECT * FROM quality_checks WHERE process_id = ? ORDER BY check_time DESC',
        [processId],
        (err, rows) => {
          if (err) reject(err)
          else resolve(rows)
        }
      )
    })
  })

  ipcMain.handle('add-quality-check', async (_, checkData) => {
    return new Promise((resolve, reject) => {
      const { process_id, parameter, value, unit, status } = checkData
      db.run(
        'INSERT INTO quality_checks (process_id, parameter, value, unit, status) VALUES (?, ?, ?, ?, ?)',
        [process_id, parameter, value, unit, status],
        function (err) {
          if (err) reject(err)
          else resolve({ id: this.lastID })
        }
      )
    })
  })

  ipcMain.handle('update-quality-check', async (_, id, checkData) => {
    return new Promise((resolve, reject) => {
      const { value, status } = checkData
      db.run(
        'UPDATE quality_checks SET value = ?, status = ? WHERE id = ?',
        [value, status, id],
        function (err) {
          if (err) reject(err)
          else resolve({ changes: this.changes })
        }
      )
    })
  })
}

// Funciones para Process Ingredients
function setupProcessIngredientHandlers() {
  ipcMain.handle('get-process-ingredients', async (_, processId) => {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT pi.*, i.name as ingredient_name 
         FROM process_ingredients pi 
         JOIN ingredients i ON pi.ingredient_id = i.id 
         WHERE pi.process_id = ?`,
        [processId],
        (err, rows) => {
          if (err) reject(err)
          else resolve(rows)
        }
      )
    })
  })

  ipcMain.handle('add-process-ingredient', async (_, ingredientData) => {
    return new Promise((resolve, reject) => {
      const { process_id, ingredient_id, required_quantity, unit } = ingredientData
      db.run(
        'INSERT INTO process_ingredients (process_id, ingredient_id, required_quantity, unit) VALUES (?, ?, ?, ?)',
        [process_id, ingredient_id, required_quantity, unit],
        function (err) {
          if (err) reject(err)
          else resolve({ success: true })
        }
      )
    })
  })

  ipcMain.handle('update-process-ingredient', async (_, processId, ingredientId, updateData) => {
    return new Promise((resolve, reject) => {
      const { used_quantity, status } = updateData
      db.run(
        'UPDATE process_ingredients SET used_quantity = ?, status = ? WHERE process_id = ? AND ingredient_id = ?',
        [used_quantity, status, processId, ingredientId],
        function (err) {
          if (err) reject(err)
          else resolve({ changes: this.changes })
        }
      )
    })
  })
}

function dialogprocess(){
  ipcMain.handle('save-pdf', async (event, pdfData, defaultPath) => {
    const { filePath } = await dialog.showSaveDialog({
      defaultPath,
      filters: [{ name: 'PDF', extensions: ['pdf'] }],
    });
  
    if (filePath) {
      try {
        // Convertir ArrayBuffer a Buffer
        const buffer = Buffer.from(pdfData);
        fs.writeFileSync(filePath, buffer);
        return { success: true, filePath };
      } catch (error) {
        console.error('Error al guardar el PDF:', error);
        return { success: false, error };
      }
    } else {
      return { success: false, error: 'Operación de guardado cancelada por el usuario.' };
    }
  });

  ipcMain.handle('read-file', async (event, filePath) => {
    try {
      const data = await fss.readFile(filePath, 'utf-8');
      return data;
    } catch (error) {
      console.error('Error al leer el archivo:', error);
      throw error; // Lanza el error para que pueda ser manejado en el proceso de renderizado
    }
  });
  
  ipcMain.handle('write-file', async (event, filePath, data) => {
    try {
      await fss.writeFile(filePath, data, 'utf-8');
    } catch (error) {
      console.error('Error al escribir en el archivo:', error);
      throw error; // Lanza el error para que pueda ser manejado en el proceso de renderizado
    }
  });

}

// Función principal para configurar todos los manejadores
function setupIPCHandlers() {
  setupRecipeHandlers()
  setupIngredientHandlers()
  setupOperatorHandlers()
  setupProductionLineHandlers()
  setupRecipeIngredientHandlers()
  setupProductionProcessHandlers()
  setupProcessStepHandlers()
  setupProcessEventHandlers()
  setupQualityCheckHandlers()
  setupProcessIngredientHandlers()
  dialogprocess()
}
function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  setupIPCHandlers()
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  db.close((err) => {
    if (err) {
      console.error('Error al cerrar la base de datos:', err.message)
    } else {
      console.log('Base de datos cerrada correctamente')
    }
  })
  
  if
   (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.
