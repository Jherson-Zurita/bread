import React, { useState, useEffect } from 'react';
import {
  Card, Tabs, Form, Input, InputNumber, Button, Table, Space, Modal, Select,
  Typography, Row, Col, Alert, Popconfirm, message, Tag
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, SaveOutlined, BellOutlined
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

  // Cargar recetas desde la base de datos al montar el componente
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading({ ...loading, recipes: true });
      const [recipesData, ingredientsData] = await Promise.all([
        window.api.database.getRecipes(),
        window.api.database.getIngredients()
      ]);

      setRecipes(recipesData);
      setIngredients(ingredientsData);
    } catch (error) {
      message.error('Error al cargar los datos');
      console.error(error);
    } finally {
      setLoading({ ...loading, recipes: false });
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

      if (editingRecipe) {
        // Actualizar la receta principal
        const updatedRecipe = await window.api.database.updateRecipe(
          editingRecipe.id,
          values
        );

        // Eliminar todos los ingredientes antiguos y agregar los nuevos
        await window.api.database.deleteRecipeIngredient(editingRecipe.id);

        // Agregar los nuevos ingredientes
        for (const ingredient of values.ingredients) {
          await window.api.database.addRecipeIngredient({
            recipe_id: editingRecipe.id,
            ingredient_id: ingredient.ingredient_id,
            quantity: ingredient.quantity,
            unit: ingredient.unit
          });
        }

        setRecipes(recipes.map(recipe =>
          recipe.id === editingRecipe.id ? updatedRecipe : recipe
        ));
        message.success('Receta actualizada exitosamente');
      } else {
        // Crear nueva receta
        const newRecipe = await window.api.database.addRecipe(values);

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
            active: true
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
                name="yield"
                label="Rendimiento"
                rules={[{ required: true }]}
              >
                <InputNumber min={0} className="w-full" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="unit"
                label="Unidad"
                rules={[{ required: true }]}
              >
                <Select>
                  <Option value="kg">Kilogramos (kg)</Option>
                  <Option value="units">Unidades</Option>
                </Select>
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
    </div>
  );
};

export default Settings;