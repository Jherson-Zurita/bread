const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./bakery.db', (err) => {
  initializeDatabase();
  if (err) {
    console.error('Error al conectar con la base de datos:', err.message);
  } else {
    console.log('Conectado a SQLite');
    // Ejecutar scripts para crear tablas y definir índices
    initializeDatabase();
  }
});

function initializeDatabase() {
  db.serialize(() => {
    db.run(`
      CREATE TABLE IF NOT EXISTS recipes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name VARCHAR(100) NOT NULL,
        category VARCHAR(50),
        base_quantity DECIMAL(10,2) NOT NULL,
        base_unit VARCHAR(10) NOT NULL,
        estimated_time INTEGER NOT NULL,
        active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS ingredients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name VARCHAR(100) NOT NULL UNIQUE,
        current_stock DECIMAL(10,2) DEFAULT 0,
        unit VARCHAR(10) NOT NULL,
        min_stock DECIMAL(10,2),
        alert_percentage INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS recipe_ingredients (
        recipe_id INTEGER,
        ingredient_id INTEGER,
        quantity DECIMAL(10,2) NOT NULL,
        unit VARCHAR(10) NOT NULL,
        PRIMARY KEY (recipe_id, ingredient_id),
        FOREIGN KEY (recipe_id) REFERENCES recipes(id),
        FOREIGN KEY (ingredient_id) REFERENCES ingredients(id)
      );
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS operators (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name VARCHAR(100) NOT NULL,
        active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS production_lines (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name VARCHAR(100) NOT NULL,
        active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS production_processes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        batch_number VARCHAR(20) NOT NULL UNIQUE,
        recipe_id INTEGER,
        operator_id INTEGER,
        line_id INTEGER,
        quantity DECIMAL(10,2) NOT NULL,
        unit VARCHAR(10) NOT NULL,
        start_time TIMESTAMP,
        estimated_end_time TIMESTAMP,
        actual_end_time TIMESTAMP,
        status VARCHAR(20) NOT NULL,
        progress INTEGER DEFAULT 0,
        priority VARCHAR(20) DEFAULT 'normal',
        temperature DECIMAL(5,2),
        humidity DECIMAL(5,2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (recipe_id) REFERENCES recipes(id),
        FOREIGN KEY (operator_id) REFERENCES operators(id),
        FOREIGN KEY (line_id) REFERENCES production_lines(id)
      );
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS process_steps (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        recipe_id INTEGER ,
        step_number INTEGER NOT NULL,
        title VARCHAR(100) NOT NULL,
        description TEXT,
        estimated_time INTEGER,
        FOREIGN KEY (recipe_id) REFERENCES recipes(id)
      );
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS process_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        process_id INTEGER,
        event_time TIMESTAMP NOT NULL,
        description TEXT NOT NULL,
        status VARCHAR(20) DEFAULT 'success',
        FOREIGN KEY (process_id) REFERENCES production_processes(id)
      );
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS quality_checks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        process_id INTEGER,
        parameter VARCHAR(100) NOT NULL,
        value VARCHAR(50) NOT NULL,
        unit VARCHAR(20),
        status VARCHAR(20) NOT NULL,
        check_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (process_id) REFERENCES production_processes(id)
      );
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS process_ingredients (
        process_id INTEGER,
        ingredient_id INTEGER,
        required_quantity DECIMAL(10,2) NOT NULL,
        used_quantity DECIMAL(10,2),
        unit VARCHAR(10) NOT NULL,
        status VARCHAR(20) DEFAULT 'pending',
        PRIMARY KEY (process_id, ingredient_id),
        FOREIGN KEY (process_id) REFERENCES production_processes(id),
        FOREIGN KEY (ingredient_id) REFERENCES ingredients(id)
      );
    `);

    // Índices para optimizar consultas
    db.run(`CREATE INDEX IF NOT EXISTS idx_processes_status ON production_processes(status);`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_processes_date ON production_processes(start_time);`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_recipe ON recipe_ingredients(recipe_id);`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_process_events_process ON process_events(process_id);`);
  });
}

export default db;
