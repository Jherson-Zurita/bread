import React, { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Select,
  InputNumber,
  Table,
  Button,
  Space,
  Alert,
  Typography,
  Divider,
  message
} from 'antd';
import {
  CalculatorOutlined,
  SaveOutlined,
  PrinterOutlined,
  WarningOutlined
} from '@ant-design/icons';

const { Title } = Typography;
const { Option } = Select;

const IngredientCalculator = () => {
  const [form] = Form.useForm();
  const [recipes, setRecipes] = useState([]);
  const [calculatedIngredients, setCalculatedIngredients] = useState([]);
  const [stockAlerts, setStockAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [lines, setLines] = useState([]);

  // Cargar recetas al montar el componente
  useEffect(() => {
    loadRecipes();
    loadLines();
  }, []);

  const loadRecipes = async () => {
    try {
      const recipesData = await window.api.database.getRecipes();
      //console.log('Recipes loaded:', recipesData); // muestra 
      setRecipes(recipesData);
    } catch (error) {
      //console.error('Error loading recipes:', error);
      message.error('Error al cargar las Lineas');
    }
  };

  const loadLines = async () => {
    try {
      const linesData = await window.api.database.getProductionLines();
      //console.log('Recipes loaded:', recipesData); // muestra 
      setLines(linesData);
    } catch (error) {
      //console.error('Error loading recipes:', error);
      message.error('Error al cargar las recetas');
    }
  };

  const columns = [
    {
      title: 'Ingrediente',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Cantidad Necesaria',
      dataIndex: 'required_quantity',
      key: 'required_quantity',
      render: (text, record) => `${text} ${record.unit}`,
    },
    {
      title: 'Stock Disponible',
      dataIndex: 'current_stock',
      key: 'current_stock',
      render: (text, record) => {
        const isLow = text < record.required_quantity;
        return (
          <span style={{ color: isLow ? '#f5222d' : '#52c41a' }}>
            {text} {record.unit}
          </span>
        );
      },
    },
    {
      title: 'Estado',
      key: 'status',
      render: (_, record) => {
        const isLow = record.current_stock < record.required_quantity;
        return isLow ? (
          <Alert
            message="Stock Bajo"
            type="warning"
            showIcon
            style={{ padding: '0 8px' }}
          />
        ) : (
          <Alert
            message="Disponible"
            type="success"
            showIcon
            style={{ padding: '0 8px' }}
          />
        );
      },
    }
  ];

  const calculateIngredients = async (recipeId, quantity) => {
    //console.log('Calculating ingredients for recipe:', recipeId, 'quantity:', quantity);
    try {
      setLoading(true);

      // Obtener la receta y sus ingredientes

      const recipe = await window.api.database.getRecipeById(recipeId);
      //console.log('Recipe fetched:', recipe);
      const recipeIngredients = await window.api.database.getRecipeIngredients(recipeId);
      //console.log('Recipe ingredients fetched:', recipeIngredients);

      // Obtener información actualizada de stock para cada ingrediente
      const calculatedIngs = await Promise.all(
        recipeIngredients.map(async (ing) => {
          const ingredient = await window.api.database.getIngredientById(ing.ingredient_id);
          const scaleFactor = quantity / recipe.base_quantity;
          const required_quantity = ing.quantity * scaleFactor;

          return {
            id: ingredient.id,
            name: ingredient.name,
            required_quantity: Math.round(required_quantity * 100) / 100,
            current_stock: ingredient.current_stock,
            unit: ing.unit,
          };
        })
      );


      setCalculatedIngredients(calculatedIngs);

      // Verificar alertas de stock
      const alerts = calculatedIngs.filter(ing =>
        ing.current_stock < ing.required_quantity
      );
      setStockAlerts(alerts);
      setSelectedRecipe(recipe);

    } catch (error) {
      //console.error('Error calculating ingredients:', error);
      message.error('Error al calcular ingredientes');
    } finally {
      setLoading(false);
    }
  };

  const handleRecipeChange = (value) => {
    const quantity = form.getFieldValue('quantity');
    if (quantity) {
      calculateIngredients(value, quantity);
    }
  };

  const handleQuantityChange = (value) => {
    const recipeId = form.getFieldValue('recipe');
    if (recipeId) {
      calculateIngredients(recipeId, value);
    }
  };

  const handleSaveCalculation = async () => {
    try {
      const values = await form.validateFields();

      // Generar número de lote (puedes adaptarlo según tus necesidades)
      const batchNumber = `BATCH-${Date.now()}`;

      // Obtener fecha y hora actual
      const currentDate = new Date();

      // Estimar tiempo de finalización (por ejemplo, 2 horas después)
      const estimatedEndTime = new Date(currentDate.getTime() + (2 * 60 * 60 * 1000));

      // Crear un nuevo proceso de producción con todos los campos requeridos
      const processData = {
        batch_number: batchNumber,
        recipe_id: values.recipe,
        operator_id: 1, // Deberías obtener esto de algún sistema de autenticación
        line_id: 1, // Deberías permitir seleccionar la línea de producción
        quantity: values.quantity,
        unit: selectedRecipe.base_unit,
        start_time: currentDate.toISOString(),
        estimated_end_time: estimatedEndTime.toISOString(),
        status: 'pending',
        priority: 'normal',
        temperature: 25, // Valores por defecto o deberías permitir ingresarlos
        humidity: 50 // Valores por defecto o deberías permitir ingresarlos
      };

      const newProcess = await window.api.database.addProductionProcess(processData);

      // Agregar los ingredientes calculados al proceso
      for (const ingredient of calculatedIngredients) {
        await window.api.database.addProcessIngredient({
          process_id: newProcess.id,
          ingredient_id: ingredient.id,
          required_quantity: ingredient.required_quantity,
          unit: ingredient.unit,
        });
      }

      message.success('Cálculo guardado exitosamente');
    } catch (error) {
      //console.error('Error saving calculation:', error);
      message.error('Error al guardar el cálculo');
    }
  };

  const handlePrint = () => {
    const printContent = document.createElement('div');
    printContent.innerHTML = `
      <h2>Cálculo de Ingredientes</h2>
      <p><strong>Receta:</strong> ${selectedRecipe?.name}</p>
      <p><strong>Cantidad:</strong> ${form.getFieldValue('quantity')} ${selectedRecipe?.base_unit}</p>
      <table border="1" style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr>
            <th>Ingrediente</th>
            <th>Cantidad Necesaria</th>
            <th>Stock Disponible</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          ${calculatedIngredients.map(ing => `
            <tr>
              <td>${ing.name}</td>
              <td>${ing.required_quantity} ${ing.unit}</td>
              <td>${ing.current_stock} ${ing.unit}</td>
              <td>${ing.current_stock < ing.required_quantity ? 'Stock Bajo' : 'Disponible'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;

    const printWindow = window.open('', '', 'height=600,width=800');
    printWindow.document.write('<html><head><title>Cálculo de Ingredientes</title></head><body>');
    printWindow.document.write(printContent.innerHTML);
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <Space direction="vertical" size="large" style={{ width: '100%', padding: '20px' }}>
      <Card>
        <Title level={3}>
          <CalculatorOutlined /> Calculadora de Ingredientes
        </Title>

        <Form
          form={form}
          layout="vertical"
          onValuesChange={(_, allValues) => {
            if (allValues.recipe && allValues.quantity) {
              calculateIngredients(allValues.recipe, allValues.quantity);
            }
          }}
        >
          <Space size="large" style={{ width: '100%' }} wrap>
            <Form.Item
              name="recipe"
              label="Receta"
              rules={[{ required: true, message: 'Seleccione una receta' }]}
              style={{ width: '300px' }}
            >
              <Select
                placeholder="Seleccione una receta"
                onChange={handleRecipeChange}
                loading={loading}
              >
                {recipes.map(recipe => (
                  <Option key={recipe.id} value={recipe.id}>
                    {recipe.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="quantity"
              label="Cantidad"
              rules={[{ required: true, message: 'Ingrese la cantidad' }]}
            >
              <InputNumber
                min={1}
                step={100}
                style={{ width: '200px' }}
                onChange={handleQuantityChange}
                addonAfter={selectedRecipe?.base_unit || 'g'}
              />
            </Form.Item>

            <Form.Item
              name="line_id"
              label="Línea de Producción"
              rules={[{ required: true, message: 'Seleccione una línea de producción' }]}
            >
              <Select style={{ width: '200px' }}>
              {lines.map(lines => (
                  <Option key={lines.id} value={lines.id}>
                    {lines.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="temperature"
              label="Temperatura (°C)"
              rules={[{ required: true, message: 'Ingrese la temperatura' }]}
            >
              <InputNumber
                min={0}
                max={100}
                style={{ width: '150px' }}
              />
            </Form.Item>

            <Form.Item
              name="humidity"
              label="Humedad (%)"
              rules={[{ required: true, message: 'Ingrese la humedad' }]}
            >
              <InputNumber
                min={0}
                max={100}
                style={{ width: '150px' }}
              />
            </Form.Item>

            <Form.Item
              name="priority"
              label="Prioridad"
              rules={[{ required: true, message: 'Seleccione la prioridad' }]}
            >
              <Select style={{ width: '150px' }}>
                <Option value="low">Baja</Option>
                <Option value="normal">Normal</Option>
                <Option value="high">Alta</Option>
              </Select>
            </Form.Item>
          </Space>
        </Form>

        {stockAlerts.length > 0 && (
          <Alert
            message="¡Advertencia de Stock!"
            description={
              <div>
                Los siguientes ingredientes tienen stock insuficiente:
                <ul>
                  {stockAlerts.map((ing) => (
                    <li key={ing.id}>
                      {ing.name} (Necesario: {ing.required_quantity} {ing.unit},
                      Disponible: {ing.current_stock} {ing.unit})
                    </li>
                  ))}
                </ul>
              </div>
            }
            type="warning"
            showIcon
            icon={<WarningOutlined />}
            style={{ marginBottom: '16px' }}
          />
        )}

        {calculatedIngredients.length > 0 && (
          <>
            <Divider />
            <Table
              columns={columns}
              dataSource={calculatedIngredients}
              rowKey="id"
              pagination={false}
              bordered
            />

            <Divider />
            <Space>
              <Button
                type="primary"
                icon={<SaveOutlined />}
                onClick={handleSaveCalculation}
                loading={loading}
              >
                Guardar Cálculo
              </Button>
              <Button
                icon={<PrinterOutlined />}
                onClick={handlePrint}
              >
                Imprimir
              </Button>
            </Space>
          </>
        )}
      </Card>
    </Space>
  );
};

export default IngredientCalculator;