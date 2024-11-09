import React, { useState, useEffect } from 'react';
import {
  Card, Tabs, Form, Input, InputNumber, Button, Table, Space, Modal, Select,
  Typography, Row, Col, Alert, Popconfirm, message, Tag, Switch, Empty,Upload
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, SaveOutlined, BellOutlined, LineChartOutlined, 
  OrderedListOutlined,UploadOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;

const Settings = () => {
  const [recipeForm] = Form.useForm();
  const [loading, setLoading] = useState({
    recipes: false,
    action: false
  });
  const [editingRecipe, setEditingRecipe] = useState(null);
  const [isRecipeModalVisible, setIsRecipeModalVisible] = useState(false);
  const [recipes, setRecipes] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [selectedRecipeId, setSelectedRecipeId] = useState(null);

  const [ingredientForm] = Form.useForm();
  const [editingIngredient, setEditingIngredient] = useState(null);
  const [isIngredientModalVisible, setIsIngredientModalVisible] = useState(false);

  const [operatorForm] = Form.useForm();
  const [editingOperator, setEditingOperator] = useState(null);
  const [isOperatorModalVisible, setIsOperatorModalVisible] = useState(false);
  const [operators, setOperators] = useState([]);

  const [productionLineForm] = Form.useForm();
  const [editingProductionLine, setEditingProductionLine] = useState(null);
  const [isProductionLineModalVisible, setIsProductionLineModalVisible] = useState(false);
  const [productionLines, setProductionLines] = useState([]);

  const [processStepForm] = Form.useForm();
  const [editingProcessStep, setEditingProcessStep] = useState(null);
  const [isProcessStepModalVisible, setIsProcessStepModalVisible] = useState(false);
  const [processSteps, setProcessSteps] = useState([]);

  // Cargar recetas desde la base de datos al montar el componente
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading({ ...loading, recipes: true });
      const [recipesData, ingredientsData, operatorsData, productionLinesData] = await Promise.all([
        window.api.database.getRecipes(),
        window.api.database.getIngredients(),
        window.api.database.getOperators(),
        window.api.database.getProductionLines()
      ]);

      setRecipes(recipesData);
      setIngredients(ingredientsData);
      setOperators(operatorsData);
      setProductionLines(productionLinesData);
    } catch (error) {
      message.error('Error al cargar los datos');
      console.error(error);
    } finally {
      setLoading({ ...loading, recipes: false });
    }
  };

  const loadProcessSteps = async (recipeId) => {
    try {
      const stepsData = await window.api.database.getProcessSteps(recipeId);
      setProcessSteps(stepsData);
    } catch (error) {
      message.error('Error al cargar los pasos de proceso');
      console.error(error);
    }
  };

  // Función para cargar los pasos de proceso de la receta seleccionada
  const handleRecipeChange = async (recipeId) => {
    setSelectedRecipeId(recipeId);
    if (recipeId) {
      await loadProcessSteps(recipeId); // Cargar pasos de proceso para la receta seleccionada
    } else {
      setProcessSteps([]); // Limpiar pasos si no hay receta seleccionada
    }
  };

  // Columnas para la tabla de recetas
  const recipeColumns = [
    {
      title: 'Nombre',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Imagen',
      dataIndex: 'image_url',
      key: 'image_url',
      render: (url) => <img src={url} alt="Receta" style={{ width: 50, height: 50 }} />
    },
    {
      title: 'Categoría',
      dataIndex: 'category',
      key: 'category',
      render: (text) => <Tag color="blue">{text}</Tag>
    },
    {
      title: 'Rendimiento',
      dataIndex: 'yield',
      key: 'yield',
      render: (text, record) => `${text} ${record.unit}`
    },
    {
      title: 'Estado',
      dataIndex: 'active',
      key: 'active',
      render: (active) => (
        <Tag color={active ? 'success' : 'default'}>
          {active ? 'Activo' : 'Inactivo'}
        </Tag>
      )
    },
    {
      title: 'Acciones',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEditRecipe(record)}
          />
          <Popconfirm
            title="¿Estás seguro de eliminar esta receta?"
            onConfirm={() => handleDeleteRecipe(record.id)}
          >
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      )
    }
  ];

  const ingredientColumns = [
    { title: 'Nombre', dataIndex: 'name', key: 'name' },
    { title: 'Stock Actual', dataIndex: 'current_stock', key: 'current_stock' },
    { title: 'Unidad', dataIndex: 'unit', key: 'unit' },
    { title: 'Stock Mínimo', dataIndex: 'min_stock', key: 'min_stock' },
    { title: 'Porcentaje de Alerta', dataIndex: 'alert_percentage', key: 'alert_percentage' },
    {
      title: 'Acciones',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEditIngredient(record)}
          />
          <Popconfirm
            title="¿Estás seguro de eliminar este ingrediente?"
            onConfirm={() => handleDeleteIngredient(record.id)}
          >
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      )
    }
  ];

  const operatorColumns = [
    { title: 'Nombre', dataIndex: 'name', key: 'name' },
    { title: 'Activo', dataIndex: 'active', key: 'active', render: (text) => (text ? 'Sí' : 'No') },
    {
      title: 'Acciones',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEditOperator(record)}
          />
          <Popconfirm
            title="¿Estás seguro de eliminar este operador?"
            onConfirm={() => handleDeleteOperator(record.id)}
          >
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      )
    }
  ];

  const productionLineColumns = [
    { title: 'Nombre', dataIndex: 'name', key: 'name' },
    { title: 'Activo', dataIndex: 'active', key: 'active', render: (text) => (text ? 'Sí' : 'No') },
    {
      title: 'Acciones',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEditProductionLine(record)}
          />
          <Popconfirm
            title="¿Estás seguro de eliminar esta línea de producción?"
            onConfirm={() => handleDeleteProductionLine(record.id)}
          >
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      )
    }
  ];

  const processStepColumns = [
    { title: 'Número de Paso', dataIndex: 'step_number', key: 'step_number' },
    { title: 'Título', dataIndex: 'title', key: 'title' },
    { title: 'Descripción', dataIndex: 'description', key: 'description' },
    { title: 'Tiempo Estimado (min)', dataIndex: 'estimated_time', key: 'estimated_time' },
    {
      title: 'Acciones',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEditProcessStep(record)}
          />
          <Popconfirm
            title="¿Estás seguro de eliminar este paso?"
            onConfirm={() => handleDeleteProcessStep(record.id)}
          >
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      )
    }
  ];
  // Manejadores de eventos para recetas
  const handleAddRecipe = () => {
    setEditingRecipe(null);
    recipeForm.resetFields();
    setIsRecipeModalVisible(true);
  };

  const handleEditRecipe = async (recipe) => {
    try {
      setLoading(prev => ({ ...prev, action: true }));
      message.loading({ content: 'Cargando detalles de la receta...', key: 'recipeLoad' });

      // Usar la función existente para obtener los ingredientes de la receta
      const recipeIngredients = await window.api.database.getRecipeIngredients(recipe.id);

      // Preparar los datos para el formulario
      const formData = {
        ...recipe,
        ingredients: recipeIngredients.map(ing => ({
          ingredient_id: ing.ingredient_id,
          quantity: ing.quantity,
          unit: ing.unit
        }))
      };

      setEditingRecipe(recipe);
      recipeForm.setFieldsValue(formData);
      setIsRecipeModalVisible(true);

      message.success({ content: 'Receta cargada', key: 'recipeLoad' });
    } catch (error) {
      console.error('Error al cargar los ingredientes de la receta:', error);
      message.error({ content: 'Error al cargar los detalles de la receta', key: 'recipeLoad' });
    } finally {
      setLoading(prev => ({ ...prev, action: false }));
    }
  };

  const handleDeleteRecipe = async (id) => {
    try {
      setLoading({ ...loading, action: true });
      await window.api.database.deleteRecipe(id);
      setRecipes(recipes.filter(recipe => recipe.id !== id));
      message.success('Receta eliminada exitosamente');
    } catch (error) {
      message.error('Error al eliminar la receta');
      console.error(error);
    } finally {
      setLoading({ ...loading, action: false });
    }
  };

  const handleSaveRecipe = async (values) => {
    try {
      setLoading({ ...loading, action: true });

      const recipeData = {
        name: values.name,
        category: values.category,
        base_quantity: values.base_quantity,
        base_unit: values.base_unit,
        estimated_time: values.estimated_time,
        active: values.active !== undefined ? values.active : true,
      };

      if (editingRecipe) {
        // Actualizar la receta principal
        const updatedRecipe = await window.api.database.updateRecipe(editingRecipe.id, recipeData);

        // Obtener los ingredientes actuales de la receta
        const currentIngredients = await window.api.database.getRecipeIngredients(editingRecipe.id);

        // Crear un mapa de ingredientes actuales
        const currentIngredientsMap = {};
        currentIngredients.forEach(ing => {
          currentIngredientsMap[ing.ingredient_id] = ing;
        });

        // Actualizar o agregar ingredientes
        for (const ingredient of values.ingredients) {
          if (currentIngredientsMap[ingredient.ingredient_id]) {
            // Si el ingrediente ya existe, actualiza
            await window.api.database.updateRecipeIngredient(editingRecipe.id, ingredient.ingredient_id, {
              quantity: ingredient.quantity,
              unit: ingredient.unit
            });
          } else {
            // Si el ingrediente no existe, agrégalo
            await window.api.database.addRecipeIngredient({
              recipe_id: editingRecipe.id,
              ingredient_id: ingredient.ingredient_id,
              quantity: ingredient.quantity,
              unit: ingredient.unit
            });
          }
        }

        setRecipes(recipes.map(recipe =>
          recipe.id === editingRecipe.id ? updatedRecipe : recipe
        ));
        message.success('Receta actualizada exitosamente');
      } else {
        // Crear nueva receta
        const newRecipe = await window.api.database.addRecipe(recipeData);

        // Agregar los ingredientes para la nueva receta
        for (const ingredient of values.ingredients) {
          await window.api.database.addRecipeIngredient({
            recipe_id: newRecipe.id,
            ingredient_id: ingredient.ingredient_id,
            quantity: ingredient.quantity,
            unit: ingredient.unit
          });
        }

        setRecipes([...recipes, newRecipe]);
        message.success('Receta creada exitosamente');
      }

      setIsRecipeModalVisible(false);
      recipeForm.resetFields();
    } catch (error) {
      message.error('Error al guardar la receta');
      console.error(error);
    } finally {
      setLoading({ ...loading, action: false });
    }
  };

  // Manejadores de eventos para ingredientes
  const handleAddIngredient = () => {
    setEditingIngredient(null);
    ingredientForm.resetFields();
    setIsIngredientModalVisible(true);
  };

  const handleEditIngredient = (ingredient) => {
    setEditingIngredient(ingredient);
    ingredientForm.setFieldsValue(ingredient);
    setIsIngredientModalVisible(true);
  };

  const handleDeleteIngredient = async (id) => {
    try {
      setLoading({ ...loading, action: true });
      await window.api.database.deleteIngredient(id);
      setIngredients(ingredients.filter(ingredient => ingredient.id !== id));
      message.success('Ingrediente eliminado exitosamente');
    } catch (error) {
      message.error('Error al eliminar el ingrediente');
      console.error(error);
    } finally {
      setLoading({ ...loading, action: false });
    }
  };

  const handleSaveIngredient = async (values) => {
    try {
      setLoading({ ...loading, action: true });
      if (editingIngredient) {
        // Actualizar ingrediente existente
        await window.api.database.updateIngredient(editingIngredient.id, values);
        setIngredients(ingredients.map(ingredient =>
          ingredient.id === editingIngredient.id ? { ...ingredient, ...values } : ingredient
        ));
        message.success('Ingrediente actualizado exitosamente');
      } else {
        // Crear nuevo ingrediente
        const newIngredient = await window.api.database.addIngredient(values);
        setIngredients([...ingredients, newIngredient]);
        message.success('Ingrediente creado exitosamente');
      }
      setIsIngredientModalVisible(false);
      ingredientForm.resetFields();
    } catch (error) {
      message.error('Error al guardar el ingrediente');
      console.error(error);
    } finally {
      setLoading({ ...loading, action: false });
    }
  };

  // Manejadores de eventos para operadores
  const handleAddOperator = () => {
    setEditingOperator(null);
    operatorForm.resetFields();
    setIsOperatorModalVisible(true);
  };

  const handleEditOperator = (operator) => {
    setEditingOperator(operator);
    operatorForm.setFieldsValue(operator);
    setIsOperatorModalVisible(true);
  };

  const handleDeleteOperator = async (id) => {
    try {
      setLoading({ ...loading, action: true });
      await window.api.database.deleteOperator(id);
      setOperators(operators.filter(operator => operator.id !== id));
      message.success('Operador eliminado exitosamente');
    } catch (error) {
      message.error('Error al eliminar el operador');
      console.error(error);
    } finally {
      setLoading({ ...loading, action: false });
    }
  };

  const handleSaveOperator = async (values) => {
    try {
      setLoading({ ...loading, action: true });
      if (editingOperator) {
        // Actualizar operador existente
        await window.api.database.updateOperator(editingOperator.id, values);
        setOperators(operators.map(operator =>
          operator.id === editingOperator.id ? { ...operator, ...values } : operator
        ));
        message.success('Operador actualizado exitosamente');
      } else {
        // Crear nuevo operador
        const newOperator = await window.api.database.addOperator(values);
        setOperators([...operators, newOperator]);
        message.success('Operador creado exitosamente');
      }
      setIsOperatorModalVisible(false);
      operatorForm.resetFields();
    } catch (error) {
      message.error('Error al guardar el operador');
      console.error(error);
    } finally {
      setLoading({ ...loading, action: false });
    }
  };

  // Manejadores de eventos para líneas de producción
  const handleAddProductionLine = () => {
    setEditingProductionLine(null);
    productionLineForm.resetFields();
    setIsProductionLineModalVisible(true);
  };

  const handleEditProductionLine = (line) => {
    setEditingProductionLine(line);
    productionLineForm.setFieldsValue(line);
    setIsProductionLineModalVisible(true);
  };

  const handleDeleteProductionLine = async (id) => {
    try {
      setLoading({ ...loading, action: true });
      await window.api.database.deleteProductionLine(id);
      setProductionLines(productionLines.filter(line => line.id !== id));
      message.success('Línea de producción eliminada exitosamente');
    } catch (error) {
      message.error('Error al eliminar la línea de producción');
      console.error(error);
    } finally {
      setLoading({ ...loading, action: false });
    }
  };

  const handleSaveProductionLine = async (values) => {
    try {
      setLoading({ ...loading, action: true });
      if (editingProductionLine) {
        // Actualizar línea de producción existente
        await window.api.database.updateProductionLine(editingProductionLine.id, values);
        setProductionLines(productionLines.map(line =>
          line.id === editingProductionLine.id ? { ...line, ...values } : line
        ));
        message.success('Línea de producción actualizada exitosamente');
      } else {
        // Crear nueva línea de producción
        const newLine = await window.api.database.addProductionLine(values);
        setProductionLines([...productionLines, newLine]);
        message.success('Línea de producción creada exitosamente');
      }
      setIsProductionLineModalVisible(false);
      productionLineForm.resetFields();
    } catch (error) {
      message.error('Error al guardar la línea de producción');
      console.error(error);
    } finally {
      setLoading({ ...loading, action: false });
    }
  };

  // Manejadores de eventos para pasos de proceso
  const handleAddProcessStep = () => {
    setEditingProcessStep(null);
    processStepForm.resetFields();
    setIsProcessStepModalVisible(true);
  };

  const handleEditProcessStep = (step) => {
    setEditingProcessStep(step);
    processStepForm.setFieldsValue(step);
    setIsProcessStepModalVisible(true);
  };

  const handleDeleteProcessStep = async (id) => {
    try {
      setLoading({ ...loading, action: true });
      await window.api.database.deleteProcessStep(id);
      setProcessSteps(processSteps.filter(step => step.id !== id));
      message.success('Paso de proceso eliminado exitosamente');
    } catch (error) {
      message.error('Error al eliminar el paso de proceso');
      console.error(error);
    } finally {
      setLoading({ ...loading, action: false });
    }
  };

  const handleSaveProcessStep = async (values) => {
    try {
      setLoading({ ...loading, action: true });
      if (editingProcessStep) {
        // Actualizar paso de proceso existente
        await window.api.database.updateProcessStep(editingProcessStep.id, values);
        setProcessSteps(processSteps.map(step =>
          step.id === editingProcessStep.id ? { ...step, ...values } : step
        ));
        message.success('Paso de proceso actualizado exitosamente');
      } else {
        // Crear nuevo paso de proceso
        const newStep = await window.api.database.addProcessStep(values);
        setProcessSteps([...processSteps, newStep]);
        message.success('Paso de proceso creado exitosamente');
      }
      setIsProcessStepModalVisible(false);
      processStepForm.resetFields();
    } catch (error) {
      message.error('Error al guardar el paso de proceso');
      console.error(error);
    } finally {
      setLoading({ ...loading, action: false });
    }
  };

  const loadRecipeDetails = async (recipeId) => {
    try {
      const [recipeBasic, recipeIngredients] = await Promise.all([
        window.api.database.getRecipe(recipeId),
        window.api.database.getRecipeIngredients(recipeId)
      ]);

      return {
        ...recipeBasic,
        ingredients: recipeIngredients
      };
    } catch (error) {
      console.error('Error loading recipe details:', error);
      throw error;
    }
  };

  const validateRecipe = (values) => {
    if (!values.ingredients || values.ingredients.length === 0) {
      throw new Error('La receta debe tener al menos un ingrediente');
    }

    // Validar que no haya ingredientes duplicados
    const ingredientIds = values.ingredients.map(ing => ing.ingredient_id);
    if (new Set(ingredientIds).size !== ingredientIds.length) {
      throw new Error('No se permiten ingredientes duplicados');
    }
  };

  return (
    <div className="p-6">
      <Title level={2}>Configuración</Title>
      <Tabs defaultActiveKey="1">
        <TabPane
          tab={
            <span>
              <SaveOutlined />
              Recetas
            </span>
          }
          key="1"
        >
          <Card>
            <Space direction="vertical" className="w-full" size="large">
              <Row justify="space-between" align="middle">
                <Col>
                  <Title level={4}>Gestión de Recetas</Title>
                </Col>
                <Col>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={handleAddRecipe}
                  >
                    Nueva Receta
                  </Button>
                </Col>
              </Row>

              <Table
                columns={recipeColumns}
                dataSource={recipes}
                rowKey="id"
                loading={loading.recipes}
                pagination={{
                  total: recipes.length,
                  pageSize: 10,
                  showTotal: (total) => `Total ${total} recetas`
                }}
              />
            </Space>
          </Card>
        </TabPane>

        <TabPane
          tab={
            <span>
              <BellOutlined />
              Ingredientes
            </span>
          }
          key="2"
        >
          <Card>
            <Space direction="vertical" className="w-full" size="large">
              <Row justify="space-between" align="middle">
                <Col>
                  <Title level={4}>Gestión de Ingredientes</Title>
                </Col>
                <Col>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={handleAddIngredient}
                  >
                    Nuevo Ingrediente
                  </Button>
                </Col>
              </Row>
              <Table
                columns={ingredientColumns}
                dataSource={ingredients}
                rowKey="id"
                loading={loading.ingredients}
                pagination={{
                  total: ingredients.length,
                  pageSize: 10,
                  showTotal: (total) => `Total ${total} ingredientes`
                }}
              />
            </Space>
          </Card>
        </TabPane>

        <TabPane
          tab={
            <span>
              <BellOutlined />
              Operadores
            </span>
          }
          key="3"
        >
          <Card>
            <Space direction="vertical" className="w-full" size="large">
              <Row justify="space-between" align="middle">
                <Col>
                  <Title level={4}>Gestión de Operadores</Title>
                </Col>
                <Col>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={handleAddOperator}
                  >
                    Nuevo Operador
                  </Button>
                </Col>
              </Row>
              <Table
                columns={operatorColumns}
                dataSource={operators}
                rowKey="id"
                loading={loading.action}
                pagination={{
                  total: operators.length,
                  pageSize: 10,
                  showTotal: (total) => `Total ${total} operadores`
                }}
              />
            </Space>
          </Card>
        </TabPane>

        <TabPane
          tab={
            <span>
              <LineChartOutlined />
              Líneas de Producción
            </span>
          }
          key="4"
        >
          <Card>
            <Space direction="vertical" className="w-full" size="large">
              <Row justify="space-between" align="middle">
                <Col>
                  <Title level={4}>Gestión de Líneas de Producción</Title>
                </Col>
                <Col>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={handleAddProductionLine}
                  >
                    Nueva Línea de Producción
                  </Button>
                </Col>
              </Row>
              <Table
                columns={productionLineColumns}
                dataSource={productionLines}
                rowKey="id"
                loading={loading.action}
                pagination={{
                  total: productionLines.length,
                  pageSize: 10,
                  showTotal: (total) => `Total ${total} líneas de producción`
                }}
              />
            </Space>
          </Card>
        </TabPane>

        <TabPane
          tab={
            <span>
              <OrderedListOutlined />
              Pasos de Proceso
            </span>
          }
          key="5"
        >
          <Card>
            <Space direction="vertical" className="w-full" size="large">
              <Row justify="space-between" align="middle">
                <Col>
                  <Title level={4}>Gestión de Pasos de Proceso</Title>
                </Col>
              </Row>
              <Form.Item label="Seleccionar Receta">
                <Select
                  placeholder="Selecciona una receta"
                  onChange={handleRecipeChange}
                  style={{ width: 300 }}
                >
                  {recipes.map(recipe => (
                    <Select.Option key={recipe.id} value={recipe.id}>
                      {recipe.name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
              {selectedRecipeId ? (
                <>
                  <Row justify="end" gutter={8}>
                    <Col>
                      <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={handleAddProcessStep}
                      >
                        Nuevo Paso de Proceso
                      </Button>
                    </Col>
                  </Row>
                  <Table
                    columns={processStepColumns}
                    dataSource={processSteps}
                    rowKey="id"
                    loading={loading.action}
                    pagination={{
                      total: processSteps.length,
                      pageSize: 10,
                      showTotal: (total) => `Total ${total} pasos de proceso`
                    }}
                  />
                </>
              ) : (
                <Empty description="No hay recetas disponibles" />
              )}
            </Space>
          </Card>
        </TabPane>

      </Tabs>

      {/* Modal para añadir/editar recetas */}
      <Modal
        title={editingRecipe ? 'Editar Receta' : 'Nueva Receta'}
        open={isRecipeModalVisible}
        onCancel={() => {
          setIsRecipeModalVisible(false);
          setEditingRecipe(null);
          recipeForm.resetFields();
        }}
        footer={null}
        width={800}
      >
        <Form
          form={recipeForm}
          onFinish={handleSaveRecipe}
          layout="vertical"
          initialValues={editingRecipe || {
            ingredients: [],
            active: true,
            image_url: ''
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="Nombre de la Receta"
                rules={[{ required: true }]}
              >
                <Input />
              </Form.Item>
              <Form.Item
                name="image_file"
                label="Imagen de la Receta"
                rules={[{ required: true, message: 'Por favor selecciona una imagen' }]}
              // Validar que se haya subido una imagen 
              >
                <Upload name="file" listType="picture" beforeUpload={() => false}
                // Para evitar la carga automática y manejarla manualmente 
                >
                  <Button icon={<UploadOutlined />}>Seleccionar Imagen</Button>
                </Upload>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="category"
                label="Categoría"
                rules={[{ required: true }]}
              >
                <Select>
                  <Option value="Panes">Panes</Option>
                  <Option value="Pasteles">Pasteles</Option>
                  <Option value="Galletas">Galletas</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="base_quantity"
                label="Cantidad Base"
                rules={[{ required: true }]}
              >
                <InputNumber min={0} className="w-full" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="base_unit"
                label="Unidad Base"
                rules={[{ required: true }]}
              >
                <Select>
                  <Option value="kg">Kilogramos (kg)</Option>
                  <Option value="L">Litros (L)</Option>
                  <Option value="g">Gramos (g)</Option>
                  <Option value="units">Unidades</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="estimated_time"
                label="Tiempo Estimado (min)"
                rules={[{ required: true }]}
              >
                <InputNumber min={0} className="w-full" />
              </Form.Item>
            </Col>
          </Row>

          <Form.List name="ingredients">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Row key={key} gutter={16} align="middle">
                    <Col span={8}>
                      <Form.Item
                        {...restField}
                        name={[name, 'ingredient_id']}
                        rules={[{ required: true }]}
                      >
                        <Select
                          placeholder="Ingrediente"
                          loading={loading.ingredients}
                          showSearch
                          optionFilterProp="children"
                        >
                          {ingredients.map(ing => (
                            <Option key={ing.id} value={ing.id}>
                              {ing.name} ({ing.current_stock} {ing.stock_unit})
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col span={6}>
                      <Form.Item
                        {...restField}
                        name={[name, 'quantity']}
                        rules={[{ required: true }]}
                      >
                        <InputNumber placeholder="Cantidad" min={0} className="w-full" />
                      </Form.Item>
                    </Col>
                    <Col span={6}>
                      <Form.Item
                        {...restField}
                        name={[name, 'unit']}
                        rules={[{ required: true }]}
                      >
                        <Select placeholder="Unidad">
                          <Option value="kg">kg</Option>
                          <Option value="L">L</Option>
                          <Option value="g">g</Option>
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col span={4}>
                      <Button type="text" danger onClick={() => remove(name)} icon={<DeleteOutlined />} />
                    </Col>
                  </Row>
                ))}
                <Form.Item>
                  <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                    Agregar Ingrediente
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>

          <Row justify="end" gutter={8}>
            <Col>
              <Button
                onClick={() => {
                  setIsRecipeModalVisible(false);
                  setEditingRecipe(null);
                  recipeForm.resetFields();
                }}
              >
                Cancelar
              </Button>
            </Col>
            <Col>
              <Button
                type="primary"
                htmlType="submit"
                icon={<SaveOutlined />}
                loading={loading.action}
              >
                Guardar
              </Button>
            </Col>
          </Row>
        </Form>
      </Modal>

      <Modal
        title={editingIngredient ? 'Editar Ingrediente' : 'Nuevo Ingrediente'}
        open={isIngredientModalVisible}
        onCancel={() => {
          setIsIngredientModalVisible(false);
          setEditingIngredient(null);
          ingredientForm.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={ingredientForm}
          onFinish={handleSaveIngredient}
          layout="vertical"
          initialValues={editingIngredient || {}}
        >
          <Form.Item
            name="name"
            label="Nombre del Ingrediente"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="current_stock"
            label="Stock Actual"
            rules={[{ required: true }]}
          >
            <InputNumber min={0} className="w-full" />
          </Form.Item>
          <Form.Item
            name="unit"
            label="Unidad"
            rules={[{ required: true }]}
          >
            <Select>
              <Option value="kg">Kilogramos (kg)</Option>
              < Option value="L">Litros (L)</Option>
              <Option value="g">Gramos (g)</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="min_stock"
            label="Stock Mínimo"
            rules={[{ required: true }]}
          >
            <InputNumber min={0} className="w-full" />
          </Form.Item>
          <Form.Item
            name="alert_percentage"
            label="Porcentaje de Alerta"
            rules={[{ required: true }]}
          >
            <InputNumber min={0} max={100} className="w-full" />
          </Form.Item>
          <Row justify="end" gutter={8}>
            <Col>
              <Button onClick={() => {
                setIsIngredientModalVisible(false);
                setEditingIngredient(null);
                ingredientForm.resetFields();
              }}>
                Cancelar
              </Button>
            </Col>
            <Col>
              <Button type="primary" htmlType="submit" loading={loading.action}>
                Guardar
              </Button>
            </Col>
          </Row>
        </Form>
      </Modal>

      <Modal
        title={editingOperator ? 'Editar Operador' : 'Nuevo Operador'}
        open={isOperatorModalVisible}
        onCancel={() => {
          setIsOperatorModalVisible(false);
          setEditingOperator(null);
          operatorForm.resetFields();
        }}
        footer={null}
        width={400}
      >
        <Form
          form={operatorForm}
          onFinish={handleSaveOperator}
          layout="vertical"
          initialValues={editingOperator || { active: true }} // Establecer activo por defecto
        >
          <Form.Item
            name="name"
            label="Nombre del Operador"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="active"
            label="Activo"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
          <Row justify="end" gutter={8}>
            <Col>
              <Button onClick={() => {
                setIsOperatorModalVisible(false);
                setEditingOperator(null);
                operatorForm.resetFields();
              }}>
                Cancelar
              </Button>
            </Col>
            <Col>
              <Button type="primary" htmlType="submit" loading={loading.action}>
                Guardar
              </Button>
            </Col>
          </Row>
        </Form>
      </Modal>

      <Modal
        title={editingProductionLine ? 'Editar Línea de Producción' : 'Nueva Línea de Producción'}
        open={isProductionLineModalVisible}
        onCancel={() => {
          setIsProductionLineModalVisible(false);
          setEditingProductionLine(null);
          productionLineForm.resetFields();
        }}
        footer={null}
        width={400}
      >
        <Form
          form={productionLineForm}
          onFinish={handleSaveProductionLine}
          layout="vertical"
          initialValues={editingProductionLine || { active: true }} // Establecer activo por defecto
        >
          <Form.Item
            name="name"
            label="Nombre de la Línea de Producción"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="active"
            label="Activo"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
          <Row justify="end" gutter={8}>
            <Col>
              <Button onClick={() => {
                setIsProductionLineModalVisible(false);
                setEditingProductionLine(null);
                productionLineForm.resetFields();
              }}>
                Cancelar
              </Button>
            </Col>
            <Col>
              <Button type="primary" htmlType="submit" loading={loading.action}>
                Guardar
              </Button>
            </Col>
          </Row>
        </Form>
      </Modal>

      <Modal
        title={editingProcessStep ? 'Editar Paso de Proceso' : 'Nuevo Paso de Proceso'}
        open={isProcessStepModalVisible}
        onCancel={() => {
          setIsProcessStepModalVisible(false);
          setEditingProcessStep(null);
          processStepForm.resetFields();
        }}
        footer={null}
        width={400}
      >
        <Form
          form={processStepForm}
          onFinish={handleSaveProcessStep}
          layout="vertical"
          initialValues={editingProcessStep || { estimated_time: 0 }} // Establecer tiempo estimado por defecto
        >
          <Form.Item
            name="step_number"
            label="Número de Paso"
            rules={[{ required: true, type: 'number', min: 1 }]}
          >
            <InputNumber min={1} />
          </Form.Item>
          <Form.Item
            name="title"
            label="Título"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="description"
            label="Descripción"
          >
            <Input.TextArea />
          </Form.Item>
          <Form.Item
            name="estimated_time"
            label="Tiempo Estimado (min)"
            rules={[{ required: true, type: 'number', min: 0 }]}
          >
            <InputNumber min={0} />
          </Form.Item>
          <Row justify="end" gutter={8}>
            <Col>
              <Button onClick={() => {
                setIsProcessStepModalVisible(false);
                setEditingProcessStep(null);
                processStepForm.resetFields();
              }}>
                Cancelar
              </Button>
            </Col>
            <Col>
              <Button type="primary" htmlType="submit" loading={loading.action}>
                Guardar
              </Button>
            </Col>
          </Row>
        </Form>
      </Modal>

    </div>
  );
};

export default Settings;