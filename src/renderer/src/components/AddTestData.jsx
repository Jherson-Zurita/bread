import React, { useEffect, useState } from 'react';
import { Button, Table, message, Select, Radio } from 'antd';
import { PlusOutlined } from '@ant-design/icons';

const DataAdder = () => {
  const [recipes, setRecipes] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [operators, setOperators] = useState([]);
  const [productionLines, setProductionLines] = useState([]);
  const [productionProcesses, setProductionProcesses] = useState([]);
  const [recipeIngredients, setRecipeIngredients] = useState([]);
  const [processEvents, setProcessEvents] = useState([]);
  const [processIngredients, setProcessIngredients] = useState([]);
  const [processSteps, setProcessSteps] = useState([]);
  const [qualityChecks, setQualityChecks] = useState([]);
  const [selectedRecipeId, setSelectedRecipeId] = useState(null);
  const [selectedProcessId, setSelectedProcessId] = useState(null);
  const [processIngredientsSource, setProcessIngredientsSource] = useState('recipe');



  // Datos de ejemplo completos para cada tabla
  const sampleData = {
    // Datos básicos de la receta
    recipe: [
      {
        name: 'Pan Blanco',
        category: 'Bakery',
        base_quantity: 10,
        base_unit: 'kg',
        estimated_time: 60
      },
      {
        name: 'Pan Integral',
        category: 'Bakery',
        base_quantity: 10,
        base_unit: 'kg',
        estimated_time: 65
      },
      {
        name: 'Pan de Centeno',
        category: 'Bakery',
        base_quantity: 8,
        base_unit: 'kg',
        estimated_time: 70
      },
      {
        name: 'Baguette',
        category: 'Bakery',
        base_quantity: 5,
        base_unit: 'units',
        estimated_time: 80
      },
      {
        name: 'Croissant',
        category: 'Bakery',
        base_quantity: 20,
        base_unit: 'units',
        estimated_time: 90
      },
      {
        name: 'Pan de Ajo',
        category: 'Bakery',
        base_quantity: 3,
        base_unit: 'kg',
        estimated_time: 50
      },
      {
        name: 'Pan de Maíz',
        category: 'Bakery',
        base_quantity: 4,
        base_unit: 'kg',
        estimated_time: 45
      },
      {
        name: 'Focaccia',
        category: 'Bakery',
        base_quantity: 2,
        base_unit: 'kg',
        estimated_time: 40
      },
      {
        name: 'Pan de Leche',
        category: 'Bakery',
        base_quantity: 6,
        base_unit: 'kg',
        estimated_time: 55
      },
      {
        name: 'Rollos de Canela',
        category: 'Bakery',
        base_quantity: 12,
        base_unit: 'units',
        estimated_time: 75
      }
    ],

    // Ingredientes con stocks y alertas
    ingredient: [
      { name: 'Harina de Trigo', current_stock: 100, unit: 'kg', min_stock: 20, alert_percentage: 10 },
      { name: 'Harina Integral', current_stock: 80, unit: 'kg', min_stock: 15, alert_percentage: 10 },
      { name: 'Harina de Centeno', current_stock: 60, unit: 'kg', min_stock: 10, alert_percentage: 10 },
      { name: 'Agua', current_stock: 200, unit: 'l', min_stock: 50, alert_percentage: 10 },
      { name: 'Sal', current_stock: 50, unit: 'kg', min_stock: 10, alert_percentage: 10 },
      { name: 'Levadura Fresca', current_stock: 30, unit: 'kg', min_stock: 5, alert_percentage: 10 },
      { name: 'Azúcar', current_stock: 45, unit: 'kg', min_stock: 8, alert_percentage: 10 },
      { name: 'Aceite de Oliva', current_stock: 75, unit: 'l', min_stock: 15, alert_percentage: 10 },
      { name: 'Leche', current_stock: 50, unit: 'l', min_stock: 10, alert_percentage: 10 },
      { name: 'Mantequilla', current_stock: 20, unit: 'kg', min_stock: 5, alert_percentage: 10 },
      { name: 'Huevos', current_stock: 120, unit: 'units', min_stock: 30, alert_percentage: 10 },
      { name: 'Semillas de Sésamo', current_stock: 25, unit: 'kg', min_stock: 5, alert_percentage: 10 },
      { name: 'Frutas Secas', current_stock: 15, unit: 'kg', min_stock: 3, alert_percentage: 10 },
      { name: 'Especias (canela, nuez moscada)', current_stock: 10, unit: 'kg', min_stock: 2, alert_percentage: 10 }
    ],

    // Relaciones entre recetas e ingredientes
    recipe_ingredients: [
      { recipe_id: 1, ingredient_id: 1, quantity: 1.5, unit: 'kg' }, // Pan Blanco
      { recipe_id: 1, ingredient_id: 4, quantity: 0.5, unit: 'l' },  // Agua
      { recipe_id: 1, ingredient_id: 5, quantity: 0.02, unit: 'kg' }, // Sal
      { recipe_id: 1, ingredient_id: 6, quantity: 0.05, unit: 'kg' }, // Levadura Fresca
      { recipe_id: 2, ingredient_id: 1, quantity: 1.5, unit: 'kg' }, // Pan Integral
      { recipe_id: 2, ingredient_id: 4, quantity: 0.5, unit: 'l' },  // Agua
      { recipe_id: 2, ingredient_id: 5, quantity: 0.02, unit: 'kg' }, // Sal
      { recipe_id: 2, ingredient_id: 6, quantity: 0.05, unit: 'kg' }, // Levadura Fresca
      { recipe_id: 3, ingredient_id: 1, quantity: 1.2, unit: 'kg' }, // Pan de Centeno
      { recipe_id: 3, ingredient_id: 4, quantity: 0.4, unit: 'l' },  // Agua
      { recipe_id: 3, ingredient_id: 5, quantity: 0.015, unit: 'kg' }, // Sal
      { recipe_id: 3, ingredient_id: 6, quantity: 0.04, unit: 'kg' }, // Levadura Fresca
      { recipe_id: 4, ingredient_id: 1, quantity: 0.8, unit: 'kg' }, // Baguette
      { recipe_id: 4, ingredient_id: 4, quantity: 0.25, unit: 'l' }, // Agua
      { recipe_id: 4, ingredient_id: 5, quantity: 0.01, unit: 'kg' }, // Sal
      { recipe_id: 4, ingredient_id: 6, quantity: 0.03, unit: 'kg' }, // Levadura Fresca
      { recipe_id: 5, ingredient_id: 1, quantity: 0.5, unit: 'kg' }, // Croissant
      { recipe_id: 5, ingredient_id: 4, quantity: 0.15, unit: 'l' }, // Agua
      { recipe_id: 5, ingredient_id: 5, quantity: 0.005, unit: 'kg' }, // Sal
      { recipe_id: 5, ingredient_id: 6, quantity: 0.02, unit: 'kg' }, // Levadura Fresca
      { recipe_id: 6, ingredient_id: 1, quantity: 1.0, unit: 'kg' }, // Pan de Ajo
      { recipe_id: 6, ingredient_id: 4, quantity: 0.3, unit: 'l' },  // Agua
      { recipe_id: 6, ingredient_id: 5, quantity: 0.01, unit: 'kg' }, // Sal
      { recipe_id: 6, ingredient_id: 6, quantity: 0.03, unit: 'kg' }, // Levadura Fresca
      { recipe_id: 7, ingredient_id: 1, quantity: 1.2, unit: 'kg' }, // Pan de Maíz
      { recipe_id: 7, ingredient_id: 4, quantity: 0.4, unit: 'l' },  // Agua
      { recipe_id: 7, ingredient_id: 5, quantity: 0.02, unit: 'kg' }, // Sal
      { recipe_id: 7, ingredient_id: 6, quantity: 0.04, unit: 'kg' }, // Levadura Fresca
      { recipe_id: 8, ingredient_id: 1, quantity: 1.0, unit: 'kg' }, // Focaccia
      { recipe_id: 8, ingredient_id: 4, quantity: 0.3, unit: 'l' },  // Agua
      { recipe_id: 8, ingredient_id: 5, quantity: 0.01, unit: 'kg' }, // Sal
      { recipe_id: 8, ingredient_id: 6, quantity: 0.03, unit: 'kg' }, // Levadura Fresca
      { recipe_id: 9, ingredient_id: 1, quantity: 1.5, unit: 'kg' }, // Pan de Oliva
      { recipe_id: 9, ingredient_id: 4, quantity: 0.5, unit: 'l' },  // Agua
      { recipe_id: 9, ingredient_id: 5, quantity: 0.02, unit: 'kg' }, // Sal
      { recipe_id: 9, ingredient_id: 6, quantity: 0.05, unit: 'kg' }, // Levadura Fresca
      { recipe_id: 10, ingredient_id: 1, quantity: 1.0, unit: 'kg' }, // Pan de Semillas
      { recipe_id: 10, ingredient_id: 4, quantity: 0.3, unit: 'l' },  // Agua
      { recipe_id: 10, ingredient_id: 5, quantity: 0.01, unit: 'kg' }, // Sal
      { recipe_id: 10, ingredient_id: 6, quantity: 0.03, unit: 'kg' }  // Levadura Fresca
    ],

    // Operadores de producción
    operators: [
      { id: 1, name: 'Juan Pérez', active: true },
      { id: 2, name: 'María López', active: true },
      { id: 3, name: 'Carlos García', active: true },
      { id: 4, name: 'Ana Martínez', active: true },
      { id: 5, name: 'Luis Fernández', active: false }, // Este operador no está activo
      { id: 6, name: 'Sofía Rodríguez', active: true },
      { id: 7, name: 'Pedro Sánchez', active: true },
      { id: 8, name: 'Lucía Torres', active: true },
      { id: 9, name: 'Javier Romero', active: false }, // Este operador no está activo
      { id: 10, name: 'Claudia Morales', active: true }
    ],

    // Líneas de producción
    production_lines: [
      { id: 1, name: 'Línea de Panadería', active: true },
      { id: 2, name: 'Línea de Pastelería', active: true },
      { id: 3, name: 'Línea de Bollería', active: true },
      { id: 4, name: 'Línea de Galletas', active: true },
      { id: 5, name: 'Línea de Pan Sin Gluten', active: false }, // Esta línea no está activa
      { id: 6, name: 'Línea de Pan Artesanal', active: true },
      { id: 7, name: 'Línea de Productos Congelados', active: true },
      { id: 8, name: 'Línea de Productos Especiales', active: true },
      { id: 9, name: 'Línea de Salsas y Rellenos', active: false }, // Esta línea no está activa
      { id: 10, name: 'Línea de Decoración', active: true }
    ],

    // Procesos de producción
    production_processes: [
      {
        id: 1,
        batch_number: 'BATCH001',
        recipe_id: 1,
        operator_id: 2,
        line_id: 1,
        quantity: 100.00,
        unit: 'kg',
        start_time: '2023-10-01 08:00:00',
        estimated_end_time: '2023-10-01 12:00:00',
        actual_end_time: null,
        status: 'in_progress',
        progress: 50,
        priority: 'normal',
        temperature: 25.00,
        humidity: 60.00,
        created_at: '2023-10-01 07:45:00'
      },
      {
        id: 2,
        batch_number: 'BATCH002',
        recipe_id: 2,
        operator_id: 3,
        line_id: 2,
        quantity: 50.00,
        unit: 'kg',
        start_time: '2023-10-01 09:00:00',
        estimated_end_time: '2023-10-01 13:00:00',
        actual_end_time: null,
        status: 'in_progress',
        progress: 30,
        priority: 'high',
        temperature: 22.00,
        humidity: 55.00,
        created_at: '2023-10-01 08:30:00'
      },
      {
        id: 3,
        batch_number: 'BATCH003',
        recipe_id: 3,
        operator_id: 1,
        line_id: 3,
        quantity: 75.00,
        unit: 'kg',
        start_time: '2023-10-01 10:00:00',
        estimated_end_time: '2023-10-01 14:00:00',
        actual_end_time: null,
        status: 'not_started',
        progress: 0,
        priority: 'low',
        temperature: 24.00,
        humidity: 65.00,
        created_at: '2023-10-01 09:00:00'
      },
      {
        id: 4,
        batch_number: 'BATCH004',
        recipe_id: 4,
        operator_id: 4,
        line_id: 4,
        quantity: 30.00,
        unit: 'kg',
        start_time: '2023-10-01 11:00:00',
        estimated_end_time: '2023-10-01 15:00:00',
        actual_end_time: null,
        status: 'in_progress',
        progress: 10,
        priority: 'normal',
        temperature: 23.00,
        humidity: 70.00,
        created_at: '2023-10-01 10:30:00'
      },
      {
        id: 5,
        batch_number: 'BATCH005',
        recipe_id: 5,
        operator_id: 6,
        line_id: 5,
        quantity: 20.00,
        unit: 'kg',
        start_time: '2023-10-01 12:00:00',
        estimated_end_time: '2023-10-01 16:00:00',
        actual_end_time: null,
        status: 'not_started',
        progress: 0,
        priority: 'high',
        temperature: 26.00,
        humidity: 50.00,
        created_at: '2023-10-01 11:00:00'
      }
    ],

    // Pasos del proceso para cada receta
    process_steps: [
      {
        id: 1,
        recipe_id: 1,
        step_number: 1,
        title: 'Mezclar Ingredientes Secos',
        description: 'Combinar harina, azúcar, sal y levadura en un tazón grande.',
        estimated_time: 10 // en minutos
      },
      {
        id: 2,
        recipe_id: 1,
        step_number: 2,
        title: 'Agregar Ingredientes Líquidos',
        description: 'Añadir agua y aceite a la mezcla de ingredientes secos y mezclar bien.',
        estimated_time: 5 // en minutos
      },
      {
        id: 3,
        recipe_id: 1,
        step_number: 3,
        title: 'Amasar la Masa',
        description: 'Amasar la mezcla durante al menos 10 minutos hasta que esté suave y elástica.',
        estimated_time: 10 // en minutos
      },
      {
        id: 4,
        recipe_id: 1,
        step_number: 4,
        title: 'Fermentar la Masa',
        description: 'Dejar reposar la masa en un lugar cálido durante 1 hora o hasta que duplique su tamaño.',
        estimated_time: 60 // en minutos
      },
      {
        id: 5,
        recipe_id: 2,
        step_number: 1,
        title: 'Preparar la Base',
        description: 'Batir los huevos y el azúcar hasta obtener una mezcla cremosa.',
        estimated_time: 5 // en minutos
      },
      {
        id: 6,
        recipe_id: 2,
        step_number: 2,
        title: 'Agregar Harina y Levadura',
        description: 'Incorporar la harina y la levadura en polvo a la mezcla de huevos y azúcar.',
        estimated_time: 5 // en minutos
      },
      {
        id: 7,
        recipe_id: 2,
        step_number: 3,
        title: 'Hornear',
        description: 'Verter la mezcla en un molde y hornear a 180°C durante 30 minutos.',
        estimated_time: 30 // en minutos
      },
      {
        id: 8,
        recipe_id: 3,
        step_number: 1,
        title: 'Derretir Mantequilla',
        description: 'Derretir la mantequilla en una cacerola a fuego bajo.',
        estimated_time: 5 // en minutos
      },
      {
        id: 9,
        recipe_id: 3,
        step_number: 2,
        title: 'Mezclar Ingredientes',
        description: 'Combinar la mantequilla derretida con el azúcar y los huevos, luego agregar la harina.',
        estimated_time: 10 // en minutos
      },
      {
        id: 10,
        recipe_id: 3,
        step_number: 3,
        title: 'Hornear Galletas',
        description: 'Formar bolitas y hornear a 180°C durante 12 minutos.',
        estimated_time: 12 // en minutos
      }
    ],

    // Eventos del proceso
    process_events: [
      {
        id: 1,
        process_id: 1,
        event_time: '2023-10-01 08:00:00',
        description: 'Inicio del proceso de producción para el lote BATCH001.',
        status: 'success'
      },
      {
        id: 2,
        process_id: 1,
        event_time: '2023-10-01 08:30:00',
        description: 'Mezcla de ingredientes completada.',
        status: 'success'
      },
      {
        id: 3,
        process_id: 1,
        event_time: '2023-10-01 09:00:00',
        description: 'Amasado de la masa completado.',
        status: 'success'
      },
      {
        id: 4,
        process_id: 1,
        event_time: '2023-10-01 09:05:00',
        description: 'La masa ha comenzado a fermentar.',
        status: 'success'
      },
      {
        id: 5,
        process_id: 2,
        event_time: '2023-10-01 09:00:00',
        description: 'Inicio del proceso de producción para el lote BATCH002.',
        status: 'success'
      },
      {
        id: 6,
        process_id: 2,
        event_time: '2023-10-01 09:30:00',
        description: 'Preparación de la base completada.',
        status: 'success'
      },
      {
        id: 7,
        process_id: 2,
        event_time: '2023-10-01 09:35:00',
        description: 'Horneado iniciado.',
        status: 'success'
      },
      {
        id: 8,
        process_id: 3,
        event_time: '2023-10-01 10:00:00',
        description: 'Inicio del proceso de producción para el lote BATCH003.',
        status: 'success'
      },
     {
        id: 9,
        process_id: 3,
        event_time: '2023-10-01 10:05:00',
        description: 'Mantequilla derretida y lista para mezclar.',
        status: 'success'
      },
      {
        id: 10,
        process_id: 3,
        event_time: '2023-10-01 10:15:00',
        description: 'Ingredientes combinados y mezcla lista.',
        status: 'success'
      },
      {
        id: 11,
        process_id: 3,
        event_time: '2023-10-01 10:30:00',
        description: 'Horneado de galletas completado.',
        status: 'success'
      },
      {
        id: 12,
        process_id: 1,
        event_time: '2023-10-01 10:00:00',
        description: 'La masa ha duplicado su tamaño y está lista para ser horneada.',
        status: 'success'
      }
    ],

    // Controles de calidad
    quality_checks: [
      {
        id: 1,
        process_id: 1,
        parameter: 'Temperatura de la masa',
        value: '25.00',
        unit: '°C',
        status: 'pass',
        check_time: '2023-10-01 08:15:00'
      },
      {
        id: 2,
        process_id: 1,
        parameter: 'Humedad de la masa',
        value: '60.00',
        unit: '%',
        status: 'pass',
        check_time: '2023-10-01 08:15:00'
      },
      {
        id: 3,
        process_id: 2,
        parameter: 'Tiempo de horneado',
        value: '30',
        unit: 'minutos',
        status: 'pass',
        check_time: '2023-10-01 09:45:00'
      },
      {
        id: 4,
        process_id: 2,
        parameter: 'Temperatura del horno',
        value: '180.00',
        unit: '°C',
        status: 'fail',
        check_time: '2023-10-01 09:35:00'
      },
      {
        id: 5,
        process_id: 3,
        parameter: 'Consistencia de la masa',
        value: 'Suave y elástica',
        unit: null,
        status: 'pass',
        check_time: '2023-10-01 10:10:00'
      },
      {
        id: 6,
        process_id: 3,
        parameter: 'Tamaño de la masa',
        value: 'Duplicado',
        unit: null,
        status: 'pass',
        check_time: '2023-10-01 10:10:00'
      },
      {
        id: 7,
        process_id: 1,
        parameter: 'Tiempo de fermentación',
        value: '60',
        unit: 'minutos',
        status: 'pass',
        check_time: '2023-10-01 09:00:00'
      },
      {
        id: 8,
        process_id: 2,
        parameter: 'Color de la base',
        value: 'Dorado',
        unit: null,
        status: 'pass',
        check_time: '2023-10-01 10:00:00'
      },
      {
        id: 9,
        process_id: 1,
        parameter: 'Aroma',
        value: 'Agradable',
        unit: null,
        status: 'pass',
        check_time: '2023-10-01 10:00:00'
      },
      {
        id: 10,
        process_id: 3,
        parameter: 'Sabor',
        value: 'Delicioso',
        unit: null,
        status: 'pass',
        check_time: '2023-10-01 10:35:00'
      }
    ],

    // Ingredientes para cada proceso
    process_ingredients: [
      {
        process_id: 1,
        ingredient_id: 1, // ID de la harina
        required_quantity: 1000.00,
        used_quantity: 1000.00,
        unit: 'g',
        status: 'completed'
      },
      {
        process_id: 1,
        ingredient_id: 2, // ID del azúcar
        required_quantity: 200.00,
        used_quantity: 200.00,
        unit: 'g',
        status: 'completed'
      },
      {
        process_id: 1,
        ingredient_id: 3, // ID de la sal
        required_quantity: 10.00,
        used_quantity: 10.00,
        unit: 'g',
        status: 'completed'
      },
      {
        process_id: 1,
        ingredient_id: 4, // ID de la levadura
        required_quantity: 7.00,
        used_quantity: 7.00,
        unit: 'g',
        status: 'completed'
      },
      {
        process_id: 2,
        ingredient_id: 5, // ID de los huevos
        required_quantity: 4.00,
        used_quantity: 4.00,
        unit: 'unidades',
        status: 'completed'
      },
      {
        process_id: 2,
        ingredient_id: 6, // ID de la mantequilla
        required_quantity: 150.00,
        used_quantity: 150.00,
        unit: 'g',
        status: 'completed'
      },
      {
        process_id: 2,
        ingredient_id: 7, // ID de la harina
        required_quantity: 250.00,
        used_quantity: 250.00,
        unit: 'g',
        status: 'completed'
      },
      {
        process_id: 3,
        ingredient_id: 8, // ID de la mantequilla
        required_quantity: 100.00,
        used_quantity: 100.00,
        unit: 'g',
        status: 'completed'
      },
      {
        process_id: 3,
        ingredient_id: 9, // ID del azúcar
        required_quantity: 200.00,
        used_quantity: 200.00,
        unit: 'g',
        status: 'completed'
      },
      {
        process_id: 3,
        ingredient_id: 10, // ID de la harina
        required_quantity: 300.00,
        used_quantity: 300.00,
        unit: 'g',
        status: 'completed'
      },
      {
        process_id: 3,
        ingredient_id: 11, // ID de la levadura
        required_quantity: 5.00,
        used_quantity: 5.00,
        unit: 'g',
        status: 'completed'
      },
      {
        process_id: 1,
        ingredient_id: 12, // ID del agua
        required_quantity: 600.00,
        used_quantity: 600.00,
        unit: 'ml',
        status: 'completed'
      }
    ],

  };

  // Función para añadir datos automáticamente a las tablas
  const addDataToTables = async () => {
    try {
      // Añadir recetas
      for (const recipe of sampleData.recipe) {
        await window.api.database.addRecipe(recipe);
      }

      // Añadir ingredientes
      for (const ingredient of sampleData.ingredient) {
        await window.api.database.addIngredient(ingredient);
      }

      // Añadir operadores
      for (const operator of sampleData.operators) {
        await window.api.database.addOperator(operator);
      }

      // Añadir líneas de producción
      for (const line of sampleData.production_lines) {
        await window.api.database.addProductionLine(line);
      }

      // Añadir procesos de producción
      for (const process of sampleData.production_processes) {
        await window.api.database.addProductionProcess(process);
      }

      // Añadir pasos del proceso
      for (const processStep of sampleData.process_steps) {
        await window.api.database.addProcessStep(processStep);
      }

      // Añadir eventos del proceso
      for (const event of sampleData.process_events) {
        await window.api.database.addProcessEvent(event);
      }

      // Añadir controles de calidad
      for (const check of sampleData.quality_checks) {
        await window.api.database.addQualityCheck(check);
      }

      // Añadir ingredientes del proceso
      for (const ingredient of sampleData.process_ingredients) {
        await window.api.database.addProcessIngredient(ingredient);
      }

      // Añadir relaciones entre recetas e ingredientes
      for (const recipeIngredient of sampleData.recipe_ingredients) {
        await window.api.database.addRecipeIngredient(recipeIngredient);
      }

      message.success('Datos añadidos a todas las tablas exitosamente');
      fetchAllData();  // Actualizar datos en las tablas
    } catch (error) {
      console.error(error);
      message.error('Error al añadir datos a las tablas');
    }
  };

  // Resto del código del componente permanece igual...
  const fetchAllData = async () => {
    setRecipes(await window.api.database.getRecipes());
    setIngredients(await window.api.database.getIngredients());
    setOperators(await window.api.database.getOperators());
    setProductionLines(await window.api.database.getProductionLines());
    setProductionProcesses(await window.api.database.getProductionProcesses());
    // Para las tablas que requieren ID, vamos a obtener los datos de la primera receta y el primer proceso
    const recipes = await window.api.database.getRecipes();
    const processes = await window.api.database.getProductionProcesses();

    if (recipes.length > 0) {
      const firstRecipeId = recipes[0].id;
      setProcessSteps(await window.api.database.getProcessSteps(firstRecipeId));
      setRecipeIngredients(await window.api.database.getRecipeIngredients(firstRecipeId));
    }

    if (processes.length > 0) {
      const firstProcessId = processes[0].id;
      setProcessEvents(await window.api.database.getProcessEvents(firstProcessId));
      setQualityChecks(await window.api.database.getQualityChecks(firstProcessId));
      setProcessIngredients(await window.api.database.getProcessIngredients(firstProcessId));
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Columnas de las tablas permanecen igual...
  const recipeColumns = [
    { title: 'Nombre', dataIndex: 'name', key: 'name' },
    { title: 'Categoría', dataIndex: 'category', key: 'category' },
    { title: 'Cantidad Base', dataIndex: 'base_quantity', key: 'base_quantity' },
    { title: 'Unidad Base', dataIndex: 'base_unit', key: 'base_unit' },
    { title: 'Tiempo Estimado', dataIndex: 'estimated_time', key: 'estimated_time' },
  ];

  const ingredientColumns = [
    { title: 'Nombre', dataIndex: 'name', key: 'name' },
    { title: 'Stock Actual', dataIndex: 'current_stock', key: 'current_stock' },
    { title: 'Unidad', dataIndex: 'unit', key: 'unit' },
    { title: 'Stock Mínimo', dataIndex: 'min_stock', key: 'min_stock' },
    { title: 'Porcentaje de Alerta', dataIndex: 'alert_percentage', key: 'alert_percentage' },
  ];

  const operatorColumns = [
    { title: 'Nombre', dataIndex: 'name', key: 'name' },
    { title: 'Activo', dataIndex: 'active', key: 'active', render: (text) => (text ? 'Sí' : 'No') },
  ];

  const productionLineColumns = [
    { title: 'Nombre', dataIndex: 'name', key: 'name' },
    { title: 'Activo', dataIndex: 'active', key: 'active', render: (text) => (text ? 'Sí' : 'No') },
  ];

  const productionProcessColumns = [
    { title: 'Número de Lote', dataIndex: 'batch_number', key: 'batch_number' },
    { title: 'Cantidad', dataIndex: 'quantity', key: 'quantity' },
    { title: 'Unidad', dataIndex: 'unit', key: 'unit' },
    { title: 'Estado', dataIndex: 'status', key: 'status' },
  ];

  const processStepsColumns = [
    { title: 'Receta', dataIndex: 'recipe_name', key: 'recipe_name' },
    { title: 'Número de Paso', dataIndex: 'step_number', key: 'step_number' },
    { title: 'Título', dataIndex: 'title', key: 'title' },
    { title: 'Descripción', dataIndex: 'description', key: 'description' },
    { title: 'Tiempo Estimado', dataIndex: 'estimated_time', key: 'estimated_time' },
  ];

  const processEventsColumns = [
    { title: 'Número de Lote', dataIndex: 'batch_number', key: 'batch_number' },
    { title: 'Hora del Evento', dataIndex: 'event_time', key: 'event_time' },
    { title: 'Descripción', dataIndex: 'description', key: 'description' },
    { title: 'Estado', dataIndex: 'status', key: 'status' },
  ];

  const qualityChecksColumns = [
    { title: 'Número de Lote', dataIndex: 'batch_number', key: 'batch_number' },
    { title: 'Parámetro', dataIndex: 'parameter', key: 'parameter' },
    { title: 'Valor', dataIndex: 'value', key: 'value' },
    { title: 'Unidad', dataIndex: 'unit', key: 'unit' },
    { title: 'Estado', dataIndex: 'status', key: 'status' },
  ];

  // Columnas para ProcessIngredients
  const processIngredientsColumns = [
    { title: 'Proceso ID', dataIndex: 'process_id', key: 'process_id' },
    { title: 'Ingrediente', dataIndex: 'ingredient_name', key: 'ingredient_name' },
    { title: 'Cantidad Requerida', dataIndex: 'required_quantity', key: 'required_quantity' },
    { title: 'Cantidad Usada', dataIndex: 'used_quantity', key: 'used_quantity' },
    { title: 'Unidad', dataIndex: 'unit', key: 'unit' },
    { title: 'Estado', dataIndex: 'status', key: 'status' }
  ];

  // Columnas para RecipeIngredients
  const recipeIngredientsColumns = [
    { title: 'Receta ID', dataIndex: 'recipe_id', key: 'recipe_id' },
    { title: 'Ingrediente', dataIndex: 'ingredient_name', key: 'ingredient_name' },
    { title: 'Cantidad', dataIndex: 'quantity', key: 'quantity' },
    { title: 'Unidad', dataIndex: 'unit', key: 'unit' }
  ];

  const tableProps = { pagination: true, bordered: true, size: 'middle', };

  return (
    <div style={{ padding: 16 }}>
      <Button
        type="primary"
        icon={<PlusOutlined />}
        onClick={addDataToTables}
        style={{ marginBottom: 16 }}
      >
        Añadir datos automáticamente
      </Button>

      {/* Tablas que no requieren selección */}
      <Table
        dataSource={recipes}
        columns={recipeColumns}
        rowKey="id"
        title={() => 'Recetas'}
        pagination={false}
      />
      <Table
        dataSource={ingredients}
        columns={ingredientColumns}
        rowKey="id"
        title={() => 'Ingredientes'}
        pagination={false}
        style={{ marginTop: 20 }}
      />
      <Table
        dataSource={operators}
        columns={operatorColumns}
        rowKey="id"
        title={() => 'Operadores'}
        pagination={false}
        style={{ marginTop: 20 }}
      />
      <Table
        dataSource={productionLines}
        columns={productionLineColumns}
        rowKey="id"
        title={() => 'Líneas de Producción'}
        pagination={false}
        style={{ marginTop: 20 }}
      />
      <Table
        dataSource={productionProcesses}
        columns={productionProcessColumns}
        rowKey="id"
        title={() => 'Procesos de Producción'}
        pagination={false}
        style={{ marginTop: 20 }}
      />

      {/* Selectores */}
      <div style={{ marginTop: 20, marginBottom: 20 }}>
        <Select
          style={{ width: 200, marginRight: 16 }}
          placeholder="Seleccionar Receta"
          onChange={(value) => {
            setSelectedRecipeId(value);
            window.api.database.getProcessSteps(value).then(setProcessSteps);
            window.api.database.getRecipeIngredients(value).then(setRecipeIngredients);
          }}
        >
          {recipes.map(recipe => (
            <Select.Option key={recipe.id} value={recipe.id}>{recipe.name}</Select.Option>
          ))}
        </Select>

        <Select
          style={{ width: 200 }}
          placeholder="Seleccionar Proceso"
          onChange={(value) => {
            setSelectedProcessId(value);
            window.api.database.getProcessEvents(value).then(setProcessEvents);
            window.api.database.getQualityChecks(value).then(setQualityChecks);
            window.api.database.getProcessIngredients(value).then(setProcessIngredients);
          }}
        >
          {productionProcesses.map(process => (
            <Select.Option key={process.id} value={process.id}>{process.batch_number}</Select.Option>
          ))}
        </Select>
      </div>

      {/* Tablas que dependen de la receta seleccionada */}
      <Table
        {...tableProps}
        dataSource={processSteps}
        columns={processStepsColumns}
        rowKey="id"
        title={() => 'Pasos del Proceso'}
        locale={{
          emptyText: selectedRecipeId ? 'No hay pasos para esta receta' : 'Seleccione una receta para ver los pasos'
        }}
        style={{ marginTop: 20 }}
      />

      {/* Tablas que dependen del proceso seleccionado */}
      <Table
        {...tableProps}
        dataSource={processEvents}
        columns={processEventsColumns}
        rowKey="id"
        title={() => 'Eventos del Proceso'}
        locale={{
          emptyText: selectedProcessId ? 'No hay eventos para este proceso' : 'Seleccione un proceso para ver los eventos'
        }}
        style={{ marginTop: 20 }}
      />

      <Table
        {...tableProps}
        dataSource={qualityChecks}
        columns={qualityChecksColumns}
        rowKey="id"
        title={() => 'Controles de Calidad'}
        locale={{
          emptyText: selectedProcessId ? 'No hay controles de calidad para este proceso' : 'Seleccione un proceso para ver los controles'
        }}
        style={{ marginTop: 20 }}
      />

      {/* Sección de ingredientes con selector de fuente */}
      <div style={{ marginTop: 20 }}>
        <Radio.Group
          onChange={(e) => setProcessIngredientsSource(e.target.value)}
          value={processIngredientsSource}
          style={{ marginBottom: 16 }}
        >
          <Radio.Button value="recipe">Ingredientes de Receta</Radio.Button>
          <Radio.Button value="process">Ingredientes de Proceso</Radio.Button>
        </Radio.Group>

        <Table
          {...tableProps}
          dataSource={processIngredientsSource === 'recipe' ? recipeIngredients : processIngredients}
          columns={processIngredientsSource === 'recipe' ? recipeIngredientsColumns : processIngredientsColumns}
          rowKey="id"
          title={() => processIngredientsSource === 'recipe' ? 'Ingredientes de la Receta' : 'Ingredientes del Proceso'}
          locale={{
            emptyText: processIngredientsSource === 'recipe'
              ? (selectedRecipeId ? 'No hay ingredientes para esta receta' : 'Seleccione una receta para ver los ingredientes')
              : (selectedProcessId ? 'No hay ingredientes para este proceso' : 'Seleccione un proceso para ver los ingredientes')
          }}
          style={{ marginTop: 10 }}
        />
      </div>
    </div>
  );
};

export default DataAdder;

