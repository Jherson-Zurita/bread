import React, { useEffect, useState } from 'react';
import { Button, Table, message, Select,Radio } from 'antd';
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
      { name: 'Aceite', current_stock: 75, unit: 'l', min_stock: 15, alert_percentage: 10 }
    ],

    // Operadores de producción
    operator: [
      { name: 'Juan Pérez', active: true },
      { name: 'María García', active: true },
      { name: 'Carlos Rodríguez', active: true },
      { name: 'Ana Martínez', active: false }
    ],

    // Líneas de producción
    productionLine: [
      { name: 'Línea Pan Blanco', active: true },
      { name: 'Línea Pan Integral', active: true },
      { name: 'Línea Especialidades', active: true },
      { name: 'Línea Temporal', active: false }
    ],

    // Procesos de producción
    productionProcess: [
      {
        batch_number: 'B001',
        quantity: 100,
        unit: 'kg',
        status: 'En progreso',
        priority: 'alta',
        temperature: 22.5,
        humidity: 65.0
      },
      {
        batch_number: 'B002',
        quantity: 80,
        unit: 'kg',
        status: 'Pendiente',
        priority: 'normal',
        temperature: 23.0,
        humidity: 63.5
      },
      {
        batch_number: 'B003',
        quantity: 120,
        unit: 'kg',
        status: 'Completado',
        priority: 'normal',
        temperature: 22.0,
        humidity: 64.0
      }
    ],

    // Pasos del proceso para cada receta
    processSteps: [
      { recipe_id: 1, step_number: 1, title: 'Mezclar ingredientes', description: 'Mezclar harina, sal y levadura', estimated_time: 10 },
      { recipe_id: 1, step_number: 2, title: 'Amasar', description: 'Amasar hasta punto de desarrollo', estimated_time: 15 },
      { recipe_id: 1, step_number: 3, title: 'Primera fermentación', description: 'Dejar reposar masa', estimated_time: 30 },
      { recipe_id: 1, step_number: 4, title: 'División y formado', description: 'Dividir y dar forma', estimated_time: 20 },
      { recipe_id: 1, step_number: 5, title: 'Segunda fermentación', description: 'Fermentación final', estimated_time: 45 },
      { recipe_id: 1, step_number: 6, title: 'Horneado', description: 'Hornear a 220°C', estimated_time: 35 }
    ],

    // Eventos del proceso
    processEvents: [
      { process_id: 1, event_time: new Date(), description: 'Inicio de producción', status: 'success' },
      { process_id: 1, event_time: new Date(), description: 'Mezcla completada', status: 'success' },
      { process_id: 1, event_time: new Date(), description: 'Primera fermentación iniciada', status: 'success' }
    ],

    // Controles de calidad
    qualityChecks: [
      { process_id: 1, parameter: 'Temperatura masa', value: '24', unit: '°C', status: 'success' },
      { process_id: 1, parameter: 'pH masa', value: '5.2', unit: 'pH', status: 'success' },
      { process_id: 1, parameter: 'Humedad ambiente', value: '65', unit: '%', status: 'success' }
    ],

    // Ingredientes para cada proceso
    processIngredients: [
      { process_id: 1, ingredient_id: 1, required_quantity: 60, used_quantity: 60, unit: 'kg', status: 'completed' },
      { process_id: 1, ingredient_id: 4, required_quantity: 36, used_quantity: 36, unit: 'l', status: 'completed' },
      { process_id: 1, ingredient_id: 5, required_quantity: 1.2, used_quantity: 1.2, unit: 'kg', status: 'completed' },
      { process_id: 1, ingredient_id: 6, required_quantity: 1.8, used_quantity: 1.8, unit: 'kg', status: 'completed' }
    ],

    // Relaciones entre recetas e ingredientes
    recipeIngredients: [
      { recipe_id: 1, ingredient_id: 1, quantity: 10, unit: 'kg' },
      { recipe_id: 1, ingredient_id: 4, quantity: 6, unit: 'l' },
      { recipe_id: 1, ingredient_id: 5, quantity: 0.2, unit: 'kg' },
      { recipe_id: 1, ingredient_id: 6, quantity: 0.3, unit: 'kg' }
    ]
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
      for (const operator of sampleData.operator) {
        await window.api.database.addOperator(operator);
      }

      // Añadir líneas de producción
      for (const line of sampleData.productionLine) {
        await window.api.database.addProductionLine(line);
      }

      // Añadir procesos de producción
      for (const process of sampleData.productionProcess) {
        await window.api.database.addProductionProcess(process);
      }

      // Añadir pasos del proceso
      for (const processStep of sampleData.processSteps) {
        await window.api.database.addProcessStep(processStep);
      }

      // Añadir eventos del proceso
      for (const event of sampleData.processEvents) {
        await window.api.database.addProcessEvent(event);
      }

      // Añadir controles de calidad
      for (const check of sampleData.qualityChecks) {
        await window.api.database.addQualityCheck(check);
      }

      // Añadir ingredientes del proceso
      for (const ingredient of sampleData.processIngredients) {
        await window.api.database.addProcessIngredient(ingredient);
      }

      // Añadir relaciones entre recetas e ingredientes
      for (const recipeIngredient of sampleData.recipeIngredients) {
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

