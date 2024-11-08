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
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

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
      setRecipes(recipesData);
    } catch (error) {
      message.error('Error al cargar las recetas');
    }
  };

  const loadLines = async () => {
    try {
      const linesData = await window.api.database.getProductionLines();
      setLines(linesData);
    } catch (error) {
      message.error('Error al cargar las líneas de producción');
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
    try {
      setLoading(true);
      const recipe = await window.api.database.getRecipeById(recipeId);
      const recipeIngredients = await window.api.database.getRecipeIngredients(recipeId);

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
      const alerts = calculatedIngs.filter(ing => ing.current_stock < ing.required_quantity);
      setStockAlerts(alerts);
      setSelectedRecipe(recipe);
    } catch (error) {
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
      // Crear un objeto con los datos de la receta y los ingredientes
      const savedCalculations = {
        id: Date.now(), // Generar un ID único basado en la marca de tiempo
        timestamp: new Date().toISOString(), // Marca de tiempo en formato ISO
        recipe: selectedRecipe,
        ingredients: calculatedIngredients,
        quantity: form.getFieldValue('quantity'),
      };
  
      // Ruta del archivo donde se guardarán los cálculos
      const filePath = 'src/json/calculos_recetas.json'; // Cambia esta ruta a la deseada
  
      // Leer el archivo existente (si existe) para agregar el nuevo cálculo
      let existingData = [];
      try {
        //const fileContent = await ipcRenderer.invoke('read-file', filePath);
        const fileContent = await window.api.database.readJSON(filePath);
        existingData = JSON.parse(fileContent);
      } catch (error) {
        console.log('No se pudo leer el archivo o está vacío, se creará uno nuevo.');
      }
  
      // Agregar el nuevo cálculo a los datos existentes
      existingData.push(savedCalculations);
  
      // Guardar los datos actualizados en el archivo JSON
      //await ipcRenderer.invoke('write-file', filePath, JSON.stringify(existingData, null, 2));
      await window.api.database.writeJSON(filePath, JSON.stringify(existingData, null, 2));
      message.success('Cálculo guardado en el archivo JSON');
    } catch (error) {
      message.error('Error al guardar el cálculo. Inténtalo de nuevo.');
      console.error('Error en handleSaveCalculation:', error);
    }
  };

  const handlePrint = async () => {
    try {
      const printContent = document.createElement('div');
      printContent.innerHTML = `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #000;">
          <h2 style="text-align: center; color: #000;">Cálculo de Ingredientes</h2>
          <p><strong>Receta:</strong> ${selectedRecipe?.name}</p>
          <p><strong>Cantidad:</strong> ${form.getFieldValue('quantity')} ${selectedRecipe?.base_unit}</p>
          <table border="1" style="width: 100%; border-collapse: collapse; margin-top: 20px;">
            <thead>
              <tr>
                <th style="padding: 8px; text-align: left; color: #000;">Ingrediente</th>
                <th style="padding: 8px; text-align: left; color: #000;">Cantidad Necesaria</th>
                <th style="padding: 8px; text-align: left; color: #000;">Stock Disponible</th>
                <th style="padding: 8px; text-align: left; color: #000;">Estado</th>
              </tr>
            </thead>
            <tbody>
              ${calculatedIngredients.map(ing => `
                <tr>
                  <td style="padding: 8px; color: #000;">${ing.name}</td>
                  <td style="padding: 8px; color: #000;">${ing.required_quantity} ${ing.unit}</td>
                  <td style="padding: 8px; color: #000;">${ing.current_stock} ${ing.unit}</td>
                  <td style="padding: 8px; color: #000;">${ing.current_stock < ing.required_quantity ? 'Stock Bajo' : 'Disponible'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
  
      document.body.appendChild(printContent);
  
      const canvas = await html2canvas(printContent, { scale: 2, useCORS: true });
      document.body.removeChild(printContent);
  
      const pdf = new jsPDF();
      const imgData = canvas.toDataURL('image/png');
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
  
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
  
      const pdfData = pdf.output('arraybuffer');
      const defaultPath = 'calculo_ingredientes.pdf';
  
      const result = await window.api.database.savePDF(pdfData, defaultPath);
  
      if (result.success) {
        console.log('PDF guardado correctamente en:', result.filePath);
      } else {
        console.error('Error al guardar el PDF:', result.error);
      }
    } catch (error) {
      message.error('Error al generar el PDF. Inténtalo de nuevo.');
      console.error('Error en handlePrint:', error);
    }
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