import React, { useState, useEffect } from 'react';
import {
  Card, Row, Col, Descriptions, Steps, Progress, Table, Tag, Space, Button,
  Statistic, Timeline, Divider, Typography, Spin, Empty, message, Form, Modal, Select, Input
} from 'antd';
import {
  ClockCircleOutlined, UserOutlined, EditOutlined,
  PrinterOutlined, PauseCircleOutlined
} from '@ant-design/icons';
import moment from 'moment'
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

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
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editForm] = Form.useForm();
  const [newEvent, setNewEvent] = useState({
    description: '',
    status: 'success'
  });

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

  // Función para manejar la edición del proceso
  const handleEditProcess = () => {
    editForm.setFieldsValue({
      status: processDetails.status,
      operator_id: processDetails.operator_id,
      line_id: processDetails.line_id,
      quantity: processDetails.quantity,
      priority: processDetails.priority,
      temperature: processDetails.temperature,
      humidity: processDetails.humidity
    });
    setIsEditModalVisible(true);
  };

  // Función para guardar los cambios del proceso
  const saveProcessChanges = async () => {
    try {
      await editForm.validateFields();

      const values = editForm.getFieldsValue();

      // Preparar los datos para actualizar
      const updateData = {
        ...values,
        // Convertir a número si es necesario
        temperature: values.temperature ? Number(values.temperature) : null,
        humidity: values.humidity ? Number(values.humidity) : null
      };

      await window.api.database.updateProductionProcess(selectedProcessId, updateData);

      await loadProcessDetails(selectedProcessId);

      setIsEditModalVisible(false);

      message.success('Proceso actualizado correctamente');
    } catch (error) {
      console.error('Error updating process:', error);
      message.error('Error al actualizar el proceso');
    }
  };

  // Función para imprimir el proceso
  const handlePrintProcess = async () => {
    try {
      // Obtener detalles completos del proceso
      const processDetails = await window.api.database.getProductionProcessById(selectedProcessId);
      const processEvents = await window.api.database.getProcessEvents(selectedProcessId);

      // Crear un elemento div para el contenido de impresión
      const printContent = document.createElement('div');
      printContent.style.width = '595px';
      printContent.style.padding = '10px';
      printContent.style.boxSizing = 'border-box';
      printContent.style.backgroundColor = '#ffffff';

      printContent.innerHTML = `
        <div style="font-family: Arial, sans-serif; color: #000; font-size: 10px;">
          <h2 style="text-align: center; color: #000; font-size: 14px; margin-bottom: 10px; white-space: nowrap;">
            Reporte Detallado de Proceso de Producción
          </h2>
          
          <div style="margin-bottom: 10px; font-size: 10px;">
            <table style="width: 100%; margin-bottom: 10px; border-collapse: collapse;">
              <tr>
                <td style="padding: 4px 0;"><strong>Número de Lote:</strong></td>
                <td>${processDetails.batch_number || 'N/A'}</td>
              </tr>
              <tr>
                <td style="padding: 4px 0;"><strong>Receta:</strong></td>
                <td>${recipes[processDetails.recipe_id] || 'No disponible'}</td>
              </tr>
              <tr>
                <td style="padding: 4px 0;"><strong>Línea:</strong></td>
                <td>${lines[processDetails.line_id] || 'No asignada'}</td>
              </tr>
              <tr>
                <td style="padding: 4px 0;"><strong>Operador:</strong></td>
                <td>${operators[processDetails.operator_id] || 'No asignado'}</td>
              </tr>
              <tr>
                <td style="padding: 4px 0;"><strong>Cantidad:</strong></td>
                <td>${processDetails.quantity || 'N/A'} ${processDetails.unit || ''}</td>
              </tr>
              <tr>
                <td style="padding: 4px 0;"><strong>Estado:</strong></td>
                <td>${processDetails.status || 'N/A'}</td>
              </tr>
              <tr>
                <td style="padding: 4px 0;"><strong>Prioridad:</strong></td>
                <td>${processDetails.priority || 'N/A'}</td>
              </tr>
              <tr>
                <td style="padding: 4px 0;"><strong>Hora de Inicio:</strong></td>
                <td>${processDetails.start_time || 'N/A'}</td>
              </tr>
              ${processDetails.actual_end_time ? `
                <tr>
                  <td style="padding: 4px 0;"><strong>Hora de Finalización:</strong></td>
                  <td>${processDetails.actual_end_time}</td>
                </tr>
              ` : ''}
              ${processDetails.temperature ? `
                <tr>
                  <td style="padding: 4px 0;"><strong>Temperatura:</strong></td>
                  <td>${processDetails.temperature}°C</td>
                </tr>
              ` : ''}
              ${processDetails.humidity ? `
                <tr>
                  <td style="padding: 4px 0;"><strong>Humedad:</strong></td>
                  <td>${processDetails.humidity}%</td>
                </tr>
              ` : ''}
            </table>
          </div>
          
          <h3 style="color: #000; font-size: 12px; margin: 10px 0; border-bottom: 2px solid #000; padding-bottom: 3px;">
            Ingredientes
          </h3>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 10px;">
            <thead>
              <tr>
                <th style="padding: 4px; text-align: left; color: #000; font-size: 10px; border: 1px solid #ddd; background-color: #f5f5f5;">Ingrediente</th>
                <th style="padding: 4px; text-align: left; color: #000; font-size: 10px; border: 1px solid #ddd; background-color: #f5f5f5;">Cantidad</th>
                <th style="padding: 4px; text-align: left; color: #000; font-size: 10px; border: 1px solid #ddd; background-color: #f5f5f5;">Unidad</th>
              </tr>
            </thead>
            <tbody>
              ${(processDetails.ingredients || []).map(ingredient => `
                <tr>
                  <td style="padding: 4px; color: #000; font-size: 10px; border: 1px solid #ddd;">
                    ${ingredient.name || 'N/A'}
                  </td>
                  <td style="padding: 4px; color: #000; font-size: 10px; border: 1px solid #ddd;">
                    ${ingredient.quantity || 'N/A'}
                  </td>
                  <td style="padding: 4px; color: #000; font-size: 10px; border: 1px solid #ddd;">
                    ${ingredient.unit || 'N/A'}
                  </td>
                </tr>
              `).join('') || '<tr><td colspan="3" style="text-align: center; padding: 4px;">No hay ingredientes registrados</td></tr>'}
          </table>
          
          <h3 style="color: #000; font-size: 12px; margin: 10px 0; border-bottom: 2px solid #000; padding-bottom: 3px;">
            Registro de Eventos
          </h3>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 10px;">
            <thead>
              <tr>
                <th style="padding: 4px; text-align: left; color: #000; font-size: 10px; border: 1px solid #ddd; background-color: #f5f5f5; width: 180px;">Hora</th>
                <th style="padding: 4px; text-align: left; color: #000; font-size: 10px; border: 1px solid #ddd; background-color: #f5f5f5;">Descripción</th>
                <th style="padding: 4px; text-align: left; color: #000; font-size: 10px; border: 1px solid #ddd; background-color: #f5f5f5;">Estado</th>
              </tr>
            </thead>
            <tbody>
              ${(processEvents || []).sort((a, b) => new Date(a.event_time) - new Date(b.event_time)).map(event => `
                <tr>
                  <td style="padding: 4px; color: #000; font-size: 10px; border: 1px solid #ddd;">
                    ${moment(event.event_time).format('YYYY-MM-DD HH:mm:ss')}
                  </td>
                  <td style="padding: 4px; color: #000; font-size: 10px; border: 1px solid #ddd;">
                    ${event.description || 'N/A'}
                  </td>
                  <td style="padding: 4px; color: #000; font-size : 10px; border: 1px solid #ddd;">
                    ${event.status || 'N/A'}
                  </td>
                </tr>
              `).join('') || '<tr><td colspan="3" style="text-align: center; padding: 4px;">No hay eventos registrados</td></tr>'}
            </tbody>
          </table>
        </div>
      `;

      // Agregar el contenido al cuerpo del documento
      document.body.appendChild(printContent);

      // Generar imagen con html2canvas
      const canvas = await html2canvas(printContent, {
        scale: 5, // Ajustamos la escala
        useCORS: true,
        logging: false,
        windowWidth: printContent.scrollWidth,
        windowHeight: printContent.scrollHeight,
        backgroundColor: '#ffffff'
      });

      // Eliminar el contenido de impresión del DOM
      document.body.removeChild(printContent);

      // Crear un nuevo PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'pt',
        format: 'a4'
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * pageWidth) / canvas.width;

      if (imgHeight > pageHeight) {
        const scale = pageHeight / imgHeight;
        pdf.addImage(
          canvas.toDataURL('image/jpeg', 1.0),
          'JPEG',
          0,
          0,
          pageWidth * scale,
          pageHeight,
          undefined,
          'FAST'
        );
      } else {
        pdf.addImage(
          canvas.toDataURL('image/jpeg', 1.0),
          'JPEG',
          0,
          0,
          imgWidth,
          imgHeight,
          undefined,
          'FAST'
        );
      }

      const pdfData = pdf.output('arraybuffer');
      const defaultPath = `reporte_proceso_${processDetails.batch_number}.pdf`;

      const result = await window.api.database.savePDF(pdfData, defaultPath);

      if (result.success) {
        message.success(`Reporte guardado en: ${result.filePath}`);
        console.log('PDF guardado correctamente en:', result.filePath);
      } else {
        message.error('Error al generar el reporte');
        console.error('Error al guardar el PDF:', result.error);
      }
    } catch (error) {
      message.error('Error al generar el reporte. Inténtalo de nuevo.');
      console.error('Error en handlePrintProcess:', error);
    }
  };

  // Función para manejar la adición de un nuevo evento
  const handleAddProcessEvent = async () => {
    try {
      // Validar que la descripción no esté vacía
      if (!newEvent.description.trim()) {
        message.error('La descripción del evento no puede estar vacía');
        return;
      }

      // Preparar datos del evento
      const eventData = {
        process_id: selectedProcessId,
        event_time: new Date().toISOString(),
        description: newEvent.description,
        status: newEvent.status
      };

      // Llamar a la API para agregar el evento
      await window.api.database.addProcessEvent(eventData);

      // Recargar los detalles del proceso para mostrar el nuevo evento
      await loadProcessDetails(selectedProcessId);

      // Limpiar el formulario de nuevo evento
      setNewEvent({
        description: '',
        status: 'success'
      });

      message.success('Evento agregado correctamente');
    } catch (error) {
      console.error('Error adding process event:', error);
      message.error('Error al agregar el evento');
    }
  };

  const renderEventsList = () => {
    return (
      <Card title="Eventos del Proceso">
        {processDetails && processDetails.events && processDetails.events.length > 0 ? (
          <Timeline>
            {processDetails.events.map((event, index) => (
              <Timeline.Item
                key={event.id}
                color={
                  event.status === 'success' ? 'green' :
                    event.status === 'warning' ? 'orange' :
                      event.status === 'error' ? 'red' : 'blue'
                }
              >
                <Text>{event.description}</Text>
                <br />
                <Text type="secondary">
                  {new Date(event.event_time).toLocaleString()}
                </Text>
              </Timeline.Item>
            ))}
          </Timeline>
        ) : (
          <Text type="secondary">No hay eventos disponibles</Text>
        )}
      </Card>
    );
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
    //console.log("detalles de procesos", processDetails);

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
                  <Tag color={processDetails.priority === 'urgente' ? 'red' : 'blue'}>
                    Prioridad: {processDetails.priority}
                  </Tag>
                </Space>
              </Space>
            </Col>
            <Col>
              <Space>
                <Button icon={<EditOutlined />}
                  onClick={handleEditProcess}
                  disabled={processDetails.status === 'completed'}
                >Editar</Button>
                <Button icon={<PrinterOutlined />}
                  onClick={handlePrintProcess}
                >Imprimir</Button>
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
                <Descriptions.Item label="Hora de Inicio">
                  {processDetails.start_time}
                </Descriptions.Item>
                <Descriptions.Item label="Hora Estimada de Finalización">
                  {processDetails.estimated_end_time}
                </Descriptions.Item>
                {processDetails.actual_end_time && (
                  <Descriptions.Item label="Hora Real de Finalización">
                    {moment(processDetails.actual_end_time).format('DD/MM/YYYY HH:mm:ss')}
                  </Descriptions.Item>
                )}
                <Descriptions.Item label="Progreso">
                  <Progress
                    percent={processDetails.progress}
                    status={processDetails.status === 'completed' ? 'success' : 'active'}
                  />
                </Descriptions.Item>
                {(processDetails.temperature || processDetails.humidity) && (
                  <>
                    {processDetails.temperature && (
                      <Descriptions.Item label="Temperatura">
                        {processDetails.temperature}°C
                      </Descriptions.Item>
                    )}
                    {processDetails.humidity && (
                      <Descriptions.Item label="Humedad">
                        {processDetails.humidity}%
                      </Descriptions.Item>
                    )}
                  </>
                )}
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

        <Modal
          title="Editar Proceso"
          visible={isEditModalVisible}
          onOk={saveProcessChanges}
          onCancel={() => setIsEditModalVisible(false)}
          width={800}
        >
          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Card title="Información del Proceso">
                <Form
                  form={editForm}
                  layout="vertical"
                >
                  <Form.Item
                    name="status"
                    label="Estado"
                    rules={[{ required: true, message: 'Seleccione un estado' }]}
                  >
                    <Select>
                      <Option value="in_progress">En Progreso</Option>
                      <Option value="paused">Pausado</Option>
                      <Option value="completed">Completado</Option>
                    </Select>
                  </Form.Item>

                  <Form.Item
                    name="operator_id"
                    label="Operador"
                    rules={[{ required: true, message: 'Seleccione un operador' }]}
                  >
                    <Select>
                      {Object.entries(operators).map(([id, name]) => (
                        <Option key={id} value={id}>{name}</Option>
                      ))}
                    </Select>
                  </Form.Item>

                  <Form.Item
                    name="line_id"
                    label="Línea de Producción"
                    rules={[{ required: true, message: 'Seleccione una línea de producción' }]}
                  >
                    <Select>
                      {Object.entries(lines).map(([id, name]) => (
                        <Option key={id} value={id}>{name}</Option>
                      ))}
                    </Select>
                  </Form.Item>
                  <Form.Item
                    name="quantity"
                    label="Cantidad"
                    rules={[
                      { required: true, message: 'Ingrese la cantidad' },
                      { type: 'number', min: 1, message: 'La cantidad debe ser mayor a 0' }
                    ]}
                  >
                    <Input type="number" />
                  </Form.Item>
                  <Form.Item
                    name="priority"
                    label="Prioridad"
                  >
                    <Select>
                      <Option value="baja">Baja</Option>
                      <Option value="normal">Normal</Option>
                      <Option value="alta">Alta</Option>
                      <Option value="urgente">Urgente</Option>
                    </Select>
                  </Form.Item>

                  <Form.Item
                    name="temperature"
                    label="Temperatura"
                  >
                    <Input type="number" addonAfter="°C" />
                  </Form.Item>

                  <Form.Item
                    name="humidity"
                    label="Humedad"
                  >
                    <Input type="number" addonAfter="%" />
                  </Form.Item>
                </Form>
              </Card>
            </Col>
            <Col span={12}>
              <Card title="Agregar Evento">
                <Form layout="vertical">
                  <Form.Item label="Descripción">
                    <Input.TextArea
                      rows={4}
                      value={newEvent.description}
                      onChange={(e) => setNewEvent(prev => ({
                        ...prev,
                        description: e.target.value
                      }))}
                      placeholder="Describe el evento del proceso"
                    />
                  </Form.Item>

                  <Form.Item label="Estado del Evento">
                    <Select
                      value={newEvent.status}
                      onChange={(value) => setNewEvent(prev => ({
                        ...prev,
                        status: value
                      }))}
                    >
                      <Option value="success">Éxito</Option>
                      <Option value="warning">Advertencia</Option>
                      <Option value="error">Error</Option>
                      <Option value="info">Información</Option>
                    </Select>
                  </Form.Item>

                  <Form.Item>
                    <Button
                      type="primary"
                      onClick={handleAddProcessEvent}
                      disabled={processDetails.status === 'completed'}
                    >
                      Agregar Evento
                    </Button>
                  </Form.Item>
                </Form>

                {/* Lista de eventos recientes */}
                <Divider>Eventos Recientes</Divider>
                <Timeline>
                  {processDetails.events.slice(0, 5).map((event, index) => (
                    <Timeline.Item
                      key={event.id}
                      color={
                        event.status === 'success' ? 'green' :
                          event.status === 'warning' ? 'orange' :
                            event.status === 'error' ? 'red' : 'blue'
                      }
                    >
                      <Text>{event.description}</Text>
                      <br />
                      <Text type="secondary">
                        {new Date(event.event_time).toLocaleString()}
                      </Text>
                    </Timeline.Item>
                  ))}
                </Timeline>
                {processDetails.events.length > 5 && (
                  <Button type="link" block>
                    Ver más eventos
                  </Button>
                )}
              </Card>
            </Col>
          </Row>
        </Modal>
      </Space >
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
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              {renderProcessDetails()}
              {renderEventsList()}
            </Space>
          )}
        </>
      )}
    </div>
  );
};

export default ProcessDetails;