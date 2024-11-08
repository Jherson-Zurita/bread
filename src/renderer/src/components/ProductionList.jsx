import React, { useState, useEffect } from 'react';
import {
  Card, Table, Tag, Space, Button, Progress, Typography, Badge, Dropdown, Modal, Input,
  Timeline, Row, Col, Statistic, Divider, message
} from 'antd';
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  MoreOutlined,
  ExclamationCircleOutlined,
  EditOutlined,
  StopOutlined,
  FileTextOutlined,
  PrinterOutlined
} from '@ant-design/icons';
import moment from 'moment';

const { Title, Text } = Typography;
const { Search } = Input;

const ProductionList = () => {
  const [selectedProcess, setSelectedProcess] = useState(null);
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchText, setSearchText] = useState('');
  const [processes, setProcesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recipes, setRecipes] = useState({}); // Objeto para mapear recipe_id -> name
  const [operators, setOperators] = useState({}); // Objeto para mapear operator_id -> name
  const [lines, setLines] = useState({}); // Objeto para mapear line_id -> name

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
      } catch (error) {
        console.error('Error loading reference data:', error);
        message.error('Error al cargar datos de referencia');
      }
    };
    loadReferenceData();
  }, []);

  useEffect(() => {
    loadProductionProcesses();
  }, []);

  const loadProductionProcesses = async () => {
    try {
      const data = await window.api.database.getProductionProcesses();
      setProcesses(data);
    } catch (error) {
      console.error('Error loading processes:', error);
      message.error('Error al cargar los procesos');
    } finally {
      setLoading(false);
    }
  };

  const filteredProcesses = processes.filter(process => {
    const matchesSearch = searchText ? (
      process.batch_number.toLowerCase().includes(searchText.toLowerCase()) ||
      process.recipe_name.toLowerCase().includes(searchText.toLowerCase())
    ) : true;

    const matchesStatus = filterStatus === 'all' ? true : process.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const statusColors = {
    pending: 'default',
    in_progress: 'processing',
    paused: 'warning',
    completed: 'success',
    cancelled: 'error'
  };

  const statusText = {
    pending: 'Pendiente',
    in_progress: 'En Proceso',
    paused: 'Pausado',
    completed: 'Completado',
    cancelled: 'Cancelado'
  };

  const priorityColors = {
    low: 'blue',
    normal: 'green',
    high: 'orange',
    urgent: 'red'
  };

  const getStatusTag = (status) => {
    const color = statusColors[status];
    return (
      <Tag color={color}>
        {status === 'in_progress' && <PlayCircleOutlined />}
        {status === 'paused' && <PauseCircleOutlined />}
        {status === 'completed' && <CheckCircleOutlined />}
        {status === 'pending' && <ClockCircleOutlined />}
        {' ' + statusText[status]}
      </Tag>
    );
  };

  const handleMenuClick = async (action, record) => {
    //console.log('Action:', action, 'Record:', record); // Mantener para debugging
    try {
      switch (action) {
        case 'details':
          const processDetails = await window.api.database.getProductionProcessById(record.id);
          const processEvents = await window.api.database.getProcessEvents(record.id);
          setSelectedProcess({ ...processDetails, events: processEvents });
          setDetailsVisible(true);
          break;

        case 'print':
          // Implementar lógica de impresión
          console.log('Imprimir proceso:', record.batch_number);
          // Aquí podrías abrir una nueva ventana con el reporte para imprimir
          break;

        case 'start':
          Modal.confirm({
            title: 'Iniciar proceso',
            icon: <PlayCircleOutlined />,
            content: `¿Está seguro de iniciar el proceso ${record.batch_number}?`,
            async onOk() {
              await window.api.database.updateProductionProcess(record.id, {
                status: 'in_progress',
                actual_start_time: new Date().toISOString()
              });
              await window.api.database.addProcessEvent({
                process_id: record.id,
                event_time: new Date().toISOString(),
                description: 'Proceso iniciado',
                status: 'in_progress'
              });
              loadProductionProcesses();
              message.success('Proceso iniciado exitosamente');
            }
          });
          break;

        case 'pause':
          Modal.confirm({
            title: '¿Pausar proceso?',
            icon: <ExclamationCircleOutlined />,
            content: `¿Está seguro de pausar el proceso ${record.batch_number}?`,
            async onOk() {
              await window.api.database.updateProductionProcess(record.id, {
                status: 'paused'
              });
              await window.api.database.addProcessEvent({
                process_id: record.id,
                event_time: new Date().toISOString(),
                description: 'Proceso pausado',
                status: 'paused'
              });
              loadProductionProcesses();
              message.success('Proceso pausado exitosamente');
            }
          });
          break;

        case 'resume':
          Modal.confirm({
            title: 'Reanudar proceso',
            icon: <PlayCircleOutlined />,
            content: `¿Está seguro de reanudar el proceso ${record.batch_number}?`,
            async onOk() {
              await window.api.database.updateProductionProcess(record.id, {
                status: 'in_progress'
              });
              await window.api.database.addProcessEvent({
                process_id: record.id,
                event_time: new Date().toISOString(),
                description: 'Proceso reanudado',
                status: 'in_progress'
              });
              loadProductionProcesses();
              message.success('Proceso reanudado exitosamente');
            }
          });
          break;

        case 'complete':
          Modal.confirm({
            title: 'Completar proceso',
            icon: <CheckCircleOutlined />,
            content: `¿Confirma que el proceso ${record.batch_number} está completado?`,
            async onOk() {
              try {
                await window.api.database.updateProductionProcess(record.id, {
                  status: 'completed',
                  actual_end_time: new Date().toISOString(),
                  progress: 100
                });
                await window.api.database.addProcessEvent({
                  process_id: record.id,
                  event_time: new Date().toISOString(),
                  description: 'Proceso completado',
                  status: 'completed'
                });
                
                loadProductionProcesses(); // Actualiza la lista de procesos
                message.success('Proceso completado exitosamente');

                // Cierra el modal si está abierto
                setDetailsVisible(false);
                setSelectedProcess(null);
              } catch (error) {
                console.error('Error al completar el proceso:', error);
                message.error('Error al completar el proceso');
              }
            }
          });
          break;

        case 'report':
          // Aquí podrías abrir una modal o una nueva página con el reporte detallado
          console.log('Generar reporte para el proceso:', record.batch_number);
          // Implementa la lógica para mostrar el reporte
          break;

        case 'cancel':
          Modal.confirm({
            title: 'Cancelar proceso',
            icon: <StopOutlined />,
            content: `¿Está seguro de cancelar el proceso ${record.batch_number}? Esta acción no se puede deshacer.`,
            async onOk() {
              await window.api.database.updateProductionProcess(record.id, {
                status: 'cancelled'
              });
              await window.api.database.addProcessEvent({
                process_id: record.id,
                description: 'Proceso cancelado',
                status: 'cancelled'
              });
              loadProductionProcesses();
              message.warning('Proceso cancelado');
            }
          });
          break;

        default:
          console.log('Acción no reconocida:', action);
      }
    } catch (error) {
      console.error('Error handling action:', error);
      message.error('Error al procesar la acción');
    }
  };
  const getMenuItems = (record) => {
    const items = [
      {
        key: 'details',
        label: 'Ver detalles',
        icon: <FileTextOutlined />
      },
      {
        key: 'print',
        label: 'Imprimir ficha',
        icon: <PrinterOutlined />
      }
    ];
    // Mapeo de estados en español a inglés
    const statusMap = {
      'Pendiente': 'pending',
      'En progreso': 'in_progress',
      'Pausado': 'paused',
      'Completado': 'completed',
      'Cancelado': 'cancelled'
    };

    // Normalizar el estado a inglés
    const normalizedStatus = statusMap[record.status] || record.status.toLowerCase();

    switch (normalizedStatus) {
      case 'pending':
        items.push({
          key: 'start',
          label: 'Iniciar proceso',
          icon: <PlayCircleOutlined />
        });
        break;

      case 'in_progress':
        items.push(
          {
            key: 'pause',
            label: 'Pausar proceso',
            icon: <PauseCircleOutlined />
          },
          {
            key: 'complete',
            label: 'Marcar completado',
            icon: <CheckCircleOutlined />
          }
        );
        break;

      case 'paused':
        items.push({
          key: 'resume',
          label: 'Reanudar proceso',
          icon: <PlayCircleOutlined />
        });
        break;

      case 'completed':
        items.push({
          key: 'report',
          label: 'Ver reporte',
          icon: <FileTextOutlined />
        });
        break;

      case 'cancelled':
        // Acciones específicas para procesos cancelados, si las hay
        break;
    }
    return items;
  };

  const columns = [
    {
      title: 'Lote',
      dataIndex: 'batch_number',
      key: 'batch_number',
      render: (text, record) => (
        <Space>
          <Text strong>{text}</Text>
          {record.priority === 'high' && (
            <Badge status="processing" />
          )}
        </Space>
      )
    },
    {
      title: 'Receta',
      dataIndex: 'recipe_id',
      key: 'recipe_id',
      render: (recipe_id) => recipes[recipe_id] || 'No disponible'
    },
    {
      title: 'Operador',
      dataIndex: 'operator_id',
      key: 'operator_id',
      render: (operator_id) => operators[operator_id] || 'No asignado'
    },
    {
      title: 'Línea',
      dataIndex: 'line_id',
      key: 'line_id',
      render: (line_id) => lines[line_id] || 'No asignada'
    },
    {
      title: 'Cantidad',
      dataIndex: 'quantity',
      key: 'quantity',
      render: (text) => `${text} kg`
    },
    {
      title: 'Estado',
      dataIndex: 'status',
      key: 'status',
      render: (status, record) => (
        <Space direction="vertical" size="small">
          {getStatusTag(status)}
          {status === 'in_progress' && (
            <Progress percent={record.progress} size="small" />
          )}
        </Space>
      )
    },
    {
      title: 'Acciones',
      key: 'actions',
      render: (_, record) => (
        <Dropdown
          menu={{
            items: getMenuItems(record),
            onClick: (item) => handleMenuClick(item.key, record)
          }}
          trigger={['click']}
        >
          <Button type="text" icon={<MoreOutlined />} />
        </Dropdown>
      )
    }
  ];

  const DetailModal = ({ visible, process, onClose }) => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
      if (process?.id) {
        loadProcessDetails();
      }
    }, [process]);
    const loadProcessDetails = async () => {
      try {
        setLoading(true);
        const processEvents = await window.api.database.getProcessEvents(process.id);
        const qualityChecks = await window.api.database.getQualityChecks(process.id);
        setEvents([...processEvents, ...qualityChecks].sort((a, b) =>
          new Date(a.event_time || a.check_time) - new Date(b.event_time || b.check_time)
        ));
      } catch (error) {
        console.error('Error loading process details:', error);
        message.error('Error al cargar los detalles del proceso');
      } finally {
        setLoading(false);
      }
    };
    if (!process) return null;

    return (
      <Modal
        title={`Detalles del Proceso - ${process.batchNumber}`}
        open={visible}
        onCancel={onClose}
        width={800}
        footer={[
          <Button key="print" icon={<PrinterOutlined />} onClick={() => window.print()}>
            Imprimir
          </Button>,
          <Button key="close" onClick={onClose}>
            Cerrar
          </Button>
        ]}
      >
        <Row gutter={[16, 16]}>
          <Col span={8}>
            <Statistic title="Receta" value={process.recipe} />
          </Col>
          <Col span={8}>
            <Statistic title="Cantidad" value={`${process.quantity} kg`} />
          </Col>
          <Col span={8}>
            <Statistic title="Línea" value={process.line} />
          </Col>
        </Row>

        <Divider />

        <Title level={5}>Progreso de Producción</Title>
        <Progress percent={process.progress} status="active" />

        <Divider />

        <Title level={5}>Registro de Eventos</Title>
        <Timeline
          loading={loading}
          items={events.map(event => ({
            children: (
              <>
                <Text strong>
                  {moment(event.event_time || event.check_time).format('HH:mm')}
                </Text>
                {' - '}{event.description || `${event.parameter}: ${event.value} ${event.unit || ''}`}
              </>
            )
          }))}
        />
      </Modal>
    );
  };

  return (
    <Space direction="vertical" size="large" style={{ width: '100%', padding: '20px' }}>
      <Card>
        <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
          <Col>
            <Title level={3}>Lista de Producción</Title>
          </Col>
          <Col>
            <Space>
              <Search
                placeholder="Buscar por lote o receta"
                allowClear
                onSearch={setSearchText}
                style={{ width: 300 }}
              />
              <Button type="primary" icon={<EditOutlined />}>
                Nuevo Lote
              </Button>
            </Space>
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={processes}
          rowKey="id"
          pagination={{
            total: processes.length,
            pageSize: 10,
            showTotal: (total) => `Total ${total} procesos`
          }}
        />

        <DetailModal
          visible={detailsVisible}
          process={selectedProcess}
          onClose={() => {
            setDetailsVisible(false);
            setSelectedProcess(null);
          }}
        />
      </Card>
    </Space>
  );
};

export default ProductionList;