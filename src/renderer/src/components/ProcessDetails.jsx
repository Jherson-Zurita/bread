import React, { useState, useEffect } from 'react';
import {
  Card, Row, Col, Descriptions, Steps, Progress, Table, Tag, Space, Button,
  Statistic, Timeline, Divider, Typography, Spin, Empty, message
} from 'antd';
import {
  ClockCircleOutlined, UserOutlined, EditOutlined,
  PrinterOutlined, PauseCircleOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;

const ProcessDetails = () => {
  const [selectedProcessId, setSelectedProcessId] = useState(null);
  const [processes, setProcesses] = useState([]);
  const [processDetails, setProcessDetails] = useState(null);
  const [loading, setLoading] = useState({
    list: true,
    details: false
  });
  const [recipes, setRecipes] = useState({}); // Objeto para mapear recipe_id -> name
  const [operators, setOperators] = useState({}); // Objeto para mapear operator_id -> name
  const [lines, setLines] = useState({}); // Objeto para mapear line_id -> name
  const [ingredients, setIngredients] = useState([]); // Objeto para mapear ingredient_id -> name

  useEffect(() => {
    const loadReferenceData = async () => {
      try {
        // Cargar recetas
        const recipesData = await window.api.database.getRecipes();
        const recipesMap = recipesData.reduce((acc, recipe) => {
          acc[recipe.id] = recipe.name;
          return acc;
        }, {});
        setRecipes(recipesMap);

        // Cargar operadores
        const operatorsData = await window.api.database.getOperators();
        const operatorsMap = operatorsData.reduce((acc, operator) => {
          acc[operator.id] = operator.name;
          return acc;
        }, {});
        setOperators(operatorsMap);
        // Cargar líneas
        const linesData = await window.api.database.getProductionLines();
        const linesMap = linesData.reduce((acc, line) => {
          acc[line.id] = line.name;
          return acc;
        }, {});
        setLines(linesMap);
        // cargar ingredients
        const ingredientsData = await window.api.database.getIngredients();
        const ingredientsMap = ingredientsData.reduce((acc, ingredient) => {
          acc[ingredient.id] = ingredient.name;
          return acc;
        }, {});
        setIngredients(ingredientsMap);
      } catch (error) {
        console.error('Error loading reference data:', error);
        message.error('Error al cargar datos de referencia');
      }
    };
    loadReferenceData();
  }, []);
  // Cargar lista de procesos al montar el componente
  useEffect(() => {
    loadProcesses();
  }, []);

  // Cargar detalles cuando se selecciona un proceso
  useEffect(() => {
    if (selectedProcessId) {
      loadProcessDetails(selectedProcessId);
    }
  }, [selectedProcessId]);

  const loadProcesses = async () => {
    try {
      setLoading(prev => ({ ...prev, list: true }));
      const data = await window.api.database.getProductionProcesses();
      setProcesses(data);
    } catch (error) {
      console.error('Error loading processes:', error);
      message.error('Error al cargar los procesos');
    } finally {
      setLoading(prev => ({ ...prev, list: false }));
    }
  };

  const loadProcessDetails = async (id) => {
    try {
      setLoading(prev => ({ ...prev, details: true }));
      const [process, ingredients, events] = await Promise.all([
        window.api.database.getProductionProcessById(id),
        window.api.database.getProcessIngredients(id),
        window.api.database.getProcessEvents(id)
      ]);

      //console.log("ingredientes : ",JSON.stringify(events));

      setProcessDetails({
        ...process,
        ingredients,
        events
      });
    } catch (error) {
      console.error('Error loading process details:', error);
      message.error('Error al cargar los detalles del proceso');
    } finally {
      setLoading(prev => ({ ...prev, details: false }));
    }
  };

  // Columnas para la tabla de procesos
  const processColumns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: 'Receta',
      dataIndex: 'recipe_id',
      key: 'recipe_id',
      render: (recipe_id) => recipes[recipe_id] || 'No disponible'
    },
    {
      title: 'Estado',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={
          status === 'completed' ? 'success' :
          status === 'in_progress' ? 'processing' :
          'default'
        }>
          {status.toUpperCase()}
        </Tag>
      )
    },
    {
      title: 'Operador',
      dataIndex: 'operator_id',
      key: 'operator_id',
      render: (operator_id) => operators[operator_id] || 'No asignado'
    },
    {
      title: 'Acciones',
      key: 'actions',
      render: (_, record) => (
        <Button type="link" onClick={() => setSelectedProcessId(record.id)}>
          Ver detalles
        </Button>
      )
    }
  ];

  // Vista de detalles del proceso
  const renderProcessDetails = () => {
    if (!processDetails) return null;

    return (
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Card>
          <Row justify="space-between" align="middle">
            <Col>
              <Space direction="vertical">
                <Title level={3}>Proceso #{processDetails.id}</Title>
                <Space>
                  <Tag color="blue">{recipes[processDetails.recipe_id] || 'No disponible'}</Tag>
                  <Tag color="purple">Lote: {processDetails.batch_number}</Tag>
                </Space>
              </Space>
            </Col>
            <Col>
              <Space>
                <Button icon={<EditOutlined />}>Editar</Button>
                <Button icon={<PrinterOutlined />}>Imprimir</Button>
              </Space>
            </Col>
          </Row>
        </Card>

        <Row gutter={[16, 16]}>
        <Col span={16}>
            <Card title="Información General">
              <Descriptions column={2}>
                <Descriptions.Item label="Operador">
                  <Space>
                    <UserOutlined />
                    {operators[processDetails.operator_id] || 'No asignado'}
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item label="Estado">
                  <Tag color={processDetails.status === 'completed' ? 'success' : 'processing'}>
                    {processDetails.status.toUpperCase()}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Línea de Producción">
                  {lines[processDetails.line_id] || 'No asignada'}
                </Descriptions.Item>
                <Descriptions.Item label="Cantidad">
                  {processDetails.quantity}
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </Col>

          <Col span={8}>
            <Card title="Eventos Recientes">
              <Timeline
                items={processDetails.events.slice(0, 5).map(event => ({
                  children: (
                    <Text>
                      {event.description}
                    </Text>
                  )
                }))}
              />
            </Card>
          </Col>
        </Row>

        <Card title="Ingredientes">
          <Table
            columns={[
              {
                title: 'Ingrediente',
                dataIndex: 'ingredient_id',
                key: 'ingredient_id',
                render: (ingredient_id) => ingredients[ingredient_id] || 'No asignado'
              },
              {
                title: 'Cantidad',
                dataIndex: 'required_quantity',
                key: 'required_quantity',
              },
              {
                title: 'Estado',
                dataIndex: 'status',
                key: 'status',
                render: (status) => (
                  <Tag color={status === 'completed' ? 'success' : 'processing'}>
                    {status}
                  </Tag>
                )
              }
            ]}
            dataSource={processDetails.ingredients}
            pagination={false}
          />
        </Card>
      </Space>
    );
  };

  // Vista principal
  return (
    <div style={{ padding: '20px' }}>
      {!selectedProcessId ? (
        <Card title="Procesos de Producción">
          <Table
            columns={processColumns}
            dataSource={processes}
            loading={loading.list}
            rowKey="id"
          />
        </Card>
      ) : (
        <>
          <Button 
            style={{ marginBottom: 16 }}
            onClick={() => setSelectedProcessId(null)}
          >
            Volver a la lista
          </Button>
          {loading.details ? (
            <Spin size="large" />
          ) : (
            renderProcessDetails()
          )}
        </>
      )}
    </div>
  );
};

export default ProcessDetails;