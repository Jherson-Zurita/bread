import React, { useState, useEffect } from 'react';
import { Form, Input, InputNumber, Select, DatePicker, Button, Card, Space, Divider, message, Typography } from 'antd';
import {
  SaveOutlined,
  CloseOutlined,
  PlusOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import moment from 'moment';

const { Title } = Typography;
const { Option } = Select;

const NewProcessForm = ({ onSubmit, onCancel }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [recipes, setRecipes] = useState([]);
  const [operators, setOperators] = useState([]);
  const [productionLines, setProductionLines] = useState([]);
  // Cargar datos iniciales
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [recipesData, operatorsData, linesData] = await Promise.all([
        window.api.database.getRecipes(),
        window.api.database.getOperators(),
        window.api.database.getProductionLines()
      ]);

      setRecipes(recipesData);
      setOperators(operatorsData.filter(op => op.active));
      setProductionLines(linesData.filter(line => line.active));
    } catch (error) {
      console.error('Error loading initial data:', error);
      message.error('Error al cargar los datos iniciales');
    }
  };


  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      const availability = await window.api.database.checkRecipeIngredientsAvailability(
        values.receta,
        values.cantidadLote
      );
      // Preparar datos para el proceso de producción
      const processData = {
        recipe_id: values.receta,
        operator_id: values.operador,
        line_id: values.lineaProduccion,
        quantity: values.cantidadLote,
        unit: 'kg', // Asumiendo que siempre es en kg
        start_time: values.fechaInicio.format('YYYY-MM-DD HH:mm:ss'),
        estimated_time: values.tiempoEstimado,
        status: 'pending',
        priority: values.prioridad,
        batch_number: generateBatchNumber(), // Función para generar número de lote
        notes: values.notas
      };

      if (!availability.available) {
        // Mostrar mensaje detallado de los ingredientes faltantes
        const missingIngredients = availability.ingredients
          .filter(ing => !ing.available)
          .map(ing => `${ing.name} (Necesario: ${ing.required_quantity}${ing.unit}, Disponible: ${ing.current_stock}${ing.unit})`)
          .join('\n');
  
        message.error(
          <>
            <div>No hay suficientes ingredientes disponibles:</div>
            <div style={{ marginTop: '10px' }}>
              {missingIngredients}
            </div>
          </>
        );
        return;
      }
  

      // Crear el proceso
      const newProcess = await window.api.database.addProductionProcess(processData);

      // Crear los ingredientes del proceso
      const recipeIngredients = await window.api.database.getRecipeIngredients(values.receta);
      for (const ingredient of recipeIngredients) {
        await window.api.database.addProcessIngredient({
          process_id: newProcess.id,
          ingredient_id: ingredient.ingredient_id,
          required_quantity: ingredient.quantity * (values.cantidadLote / ingredient.base_quantity),
          unit: ingredient.unit,
        });
      }

      message.success('Proceso creado exitosamente');

      if (onSubmit) {
        onSubmit(newProcess);
      }

      form.resetFields();
    } catch (error) {
      console.error('Error creating process:', error);
      message.error('Error al crear el proceso');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    if (onCancel) {
      onCancel();
    }
  };

  const onRecipeChange = async (recipeId) => {
    try {
      const recipe = recipes.find(r => r.id === recipeId);
      if (recipe) {
        form.setFieldsValue({
          tiempoEstimado: recipe.estimated_time
        });
      }
    } catch (error) {
      console.error('Error loading recipe details:', error);
    }
  };

  const generateBatchNumber = () => {
    const timestamp = moment().format('YYYYMMDD-HHmmss');
    return `BATCH-${timestamp}`;
  };

  return (
    <Card>
      <Title level={3}>Nuevo Proceso de Producción</Title>
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          cantidadLote: 100,
          prioridad: 'normal'
        }}
      >
        {/* Información básica */}
        <Title level={5}>Información Básica</Title>
        <Form.Item
          name="receta"
          label="Receta"
          rules={[{ required: true, message: 'Por favor seleccione una receta' }]}
        >
          <Select
            placeholder="Seleccione una receta"
            onChange={onRecipeChange}
          >
            {recipes.map(recipe => (
              <Option key={recipe.id} value={recipe.id}>
                {recipe.name} {/* Asegúrate de que el campo se llame 'name' en tu BD */}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="cantidadLote"
          label="Cantidad del Lote (kg)"
          rules={[{ required: true, message: 'Por favor ingrese la cantidad' }]}
        >
          <InputNumber
            min={1}
            max={1000}
            style={{ width: '30%' }}
            addonAfter="kg"
          />
        </Form.Item>

        <Form.Item
          name="fechaInicio"
          label="Fecha de Inicio"
          rules={[{ required: true, message: 'Por favor seleccione la fecha de inicio' }]}
        >
          <DatePicker
            showTime
            format="YYYY-MM-DD HH:mm"
            style={{ width: '100%' }}
          />
        </Form.Item>

        <Divider />

        {/* Producción */}
        <Title level={5}>Detalles de Producción</Title>
        <Form.Item
          name="lineaProduccion"
          label="Línea de Producción"
          rules={[{ required: true, message: 'Por favor seleccione una línea de producción' }]}
        >
          <Select placeholder="Seleccione línea de producción">
            {productionLines.map(line => (
              <Option key={line.id} value={line.id}>
                {line.name} {/* Asegúrate de que el campo se llame 'name' en tu BD */}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="operador"
          label="Operador Responsable"
          rules={[{ required: true, message: 'Por favor seleccione un operador' }]}
        >
          <Select placeholder="Seleccione operador">
            {operators.map(operator => (
              <Option key={operator.id} value={operator.id}>
                {operator.name} {/* Asegúrate de que el campo se llame 'name' en tu BD */}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="tiempoEstimado"
          label="Tiempo Estimado (minutos)"
          rules={[{ required: true, message: 'Por favor ingrese el tiempo estimado' }]}
        >
          <InputNumber
            min={1}
            style={{ width: '100%' }}
            addonAfter="min"
          />
        </Form.Item>

        <Form.Item
          name="prioridad"
          label="Prioridad"
          rules={[{ required: true, message: 'Por favor seleccione la prioridad' }]}
        >
          <Select>
            <Option value="baja">Baja</Option>
            <Option value="normal">Normal</Option>
            <Option value="alta">Alta</Option>
            <Option value="urgente">Urgente</Option>
          </Select>
        </Form.Item>

        <Divider />

        {/* Notas adicionales */}
        <Title level={5}>Información Adicional</Title>
        <Form.Item
          name="notas"
          label="Notas"
        >
          <Input.TextArea
            rows={4}
            placeholder="Ingrese notas o instrucciones especiales..."
          />
        </Form.Item>

        {/* Botones de acción */}
        <Form.Item>
          <Space>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              htmlType="submit"
              loading={loading}
            >
              Crear Proceso
            </Button>
            <Button
              icon={<CloseOutlined />}
              onClick={handleCancel}
            >
              Cancelar
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default NewProcessForm;