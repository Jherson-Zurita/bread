import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Button, Statistic, Alert, Space, Typography } from 'antd';
import { 
  PlusOutlined, 
  LoadingOutlined, 
  WarningOutlined, 
  ShopOutlined, 
  CheckCircleOutlined, 
  ClockCircleOutlined, 
  ExclamationCircleOutlined 
} from '@ant-design/icons';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  PieChart,
  Pie, 
  Cell 
} from 'recharts';

const { Title } = Typography;

const ProductionDashboard = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [showNewProcessForm, setShowNewProcessForm] = useState(false);
  const [dashboardData, setDashboardData] = useState({
    activeProcesses: 0,
    completedToday: 0,
    pendingOrders: 0,
    stockAlerts: 0
  });
  const [productionData, setProductionData] = useState([]);
  const [ingredientUsageData, setIngredientUsageData] = useState([]);
  const [efficiencyData, setEfficiencyData] = useState([]);
  const [activeProcesses, setActiveProcesses] = useState([]);
  const [lowStockIngredients, setLowStockIngredients] = useState([]);

  const COLORS = ['#1890ff', '#52c41a', '#faad14', '#f5222d'];
  const EFFICIENCY_COLORS = ['#52c41a', '#f5222d'];

  // Función para obtener los datos del dashboard
  const fetchDashboardData = async () => {
    try {
      // Obtener procesos activos
      const activeProcesses = await window.api.database.getActiveProcesses();
      
      // Obtener procesos completados hoy
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const processes = await window.api.database.getProcessesByDateRange(
        today.toISOString(),
        new Date().toISOString()
      );
      
      // Obtener ingredientes con stock bajo
      const lowStockItems = await window.api.database.getLowStockIngredients();

      setDashboardData({
        activeProcesses: activeProcesses.length,
        completedToday: processes.filter(p => p.status === 'completed').length,
        pendingOrders: processes.filter(p => p.status === 'pending').length,
        stockAlerts: lowStockItems.length
      });

      setLowStockIngredients(lowStockItems);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  // Función para obtener datos de producción semanal
  const fetchProductionData = async () => {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
      
      const processes = await window.api.database.getProcessesByDateRange(
        startDate.toISOString(),
        new Date().toISOString()
      );

      // Agrupar procesos por día y tipo de receta
      const groupedData = processes.reduce((acc, process) => {
        const date = new Date(process.start_time).toLocaleDateString('es-ES', { weekday: 'short' });
        if (!acc[date]) {
          acc[date] = {};
        }
        if (!acc[date][process.recipe_id]) {
          acc[date][process.recipe_id] = 0;
        }
        acc[date][process.recipe_id] += process.quantity;
        return acc;
      }, {});

      // Transformar datos para el gráfico
      const chartData = Object.entries(groupedData).map(([date, recipes]) => ({
        name: date,
        ...recipes
      }));

      setProductionData(chartData);
    } catch (error) {
      console.error('Error fetching production data:', error);
    }
  };

  // Función para obtener uso de ingredientes
  const fetchIngredientUsage = async () => {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      
      const ingredients = await window.api.database.getIngredients();
      const usageData = await Promise.all(
        ingredients.map(async (ingredient) => {
          const usage = await window.api.database.getIngredientUsage(
            ingredient.id,
            startDate.toISOString(),
            new Date().toISOString()
          );
          return {
            name: ingredient.name,
            cantidad: usage.total_usage || 0
          };
        })
      );

      setIngredientUsageData(usageData);
    } catch (error) {
      console.error('Error fetching ingredient usage:', error);
    }
  };

  // Función para obtener datos de eficiencia
  const fetchEfficiencyData = async () => {
    try {
      const processes = await window.api.database.getProcessesByDateRange(
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        new Date().toISOString()
      );

      const total = processes.length;
      const successful = processes.filter(p => p.status === 'completed').length;
      const failed = total - successful;

      setEfficiencyData([
        { name: 'Producción Exitosa', value: (successful / total) * 100 },
        { name: 'Merma', value: (failed / total) * 100 }
      ]);
    } catch (error) {
      console.error('Error fetching efficiency data:', error);
    }
  };

  // Función para obtener procesos activos
  const fetchActiveProcesses = async () => {
    try {
      const processes = await window.api.database.getActiveProcesses();
      setActiveProcesses(processes);
    } catch (error) {
      console.error('Error fetching active processes:', error);
    }
  };

  // Efecto para cargar todos los datos iniciales
  useEffect(() => {
    const loadAllData = async () => {
      setIsLoading(true);
      try {
        await Promise.all([
          fetchDashboardData(),
          fetchProductionData(),
          fetchIngredientUsage(),
          fetchEfficiencyData(),
          fetchActiveProcesses()
        ]);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAllData();
    
    // Configurar actualizaciones periódicas
    const interval = setInterval(loadAllData, 300000); // Actualizar cada 5 minutos
    
    return () => clearInterval(interval);
  }, []);

  return (
    <Space direction="vertical" size="large" style={{ width: '100%', padding: '20px' }}>
      {/* Header */}
      <Row justify="space-between" align="middle">
        <Col>
          <Title level={2}>Panel de Control - Panadería Industrial</Title>
        </Col>
        <Col>
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => setShowNewProcessForm(true)}
          >
            Nuevo Proceso
          </Button>
        </Col>
      </Row>

      {/* Estadísticas */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Procesos Activos"
              value={dashboardData.activeProcesses}
              prefix={<ShopOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Completados Hoy"
              value={dashboardData.completedToday}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Órdenes Pendientes"
              value={dashboardData.pendingOrders}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Alertas de Stock"
              value={dashboardData.stockAlerts}
              prefix={<ExclamationCircleOutlined />}
              valueStyle={{ color: '#f5222d' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Gráficos */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="Producción Semanal">
            <div style={{ height: 400 }}>
              <ResponsiveContainer>
                <LineChart data={productionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  {Object.keys(productionData[0] || {})
                    .filter(key => key !== 'name')
                    .map((key, index) => (
                      <Line 
                        key={key}
                        type="monotone" 
                        dataKey={key} 
                        stroke={COLORS[index % COLORS.length]} 
                      />
                    ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
        
        <Col xs={24} lg={12}>
          <Card title="Uso de Ingredientes (kg)">
            <div style={{ height: 400 }}>
              <ResponsiveContainer>
                <BarChart data={ingredientUsageData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="cantidad">
                    {ingredientUsageData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="Eficiencia de Producción">
            <div style={{ height: 400 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={efficiencyData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={130}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {efficiencyData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={EFFICIENCY_COLORS[index % EFFICIENCY_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Alertas de Stock Bajo */}
      {lowStockIngredients.length > 0 && (
        <Alert
          message={`Alerta de Stock (${lowStockIngredients.length} ingredientes)`}
          description={
            <ul>
              {lowStockIngredients.map(ingredient => (
                <li key={ingredient.id}>
                  {ingredient.name}: {ingredient.current_stock} {ingredient.unit} 
                  (Mínimo: {ingredient.min_stock} {ingredient.unit})
                </li>
              ))}
            </ul>
          }
          type="warning"
          showIcon
          icon={<WarningOutlined />}
        />
      )}

      {/* Estado de Carga */}
      {isLoading && (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <LoadingOutlined style={{ fontSize: 24 }} spin />
        </div>
      )}

      {/* Procesos Activos */}
      <Card title="Procesos en Curso">
        {activeProcesses.length > 0 ? (
          <ul>
            {activeProcesses.map(process => (
              <li key={process.id}>
                Batch #{process.batch_number} - {process.recipe_id} 
                (Progreso: {process.progress}%)
              </li>
            ))}
          </ul>
        ) : (
          <p style={{ color: 'rgba(0, 0, 0, 0.45)' }}>
            No hay procesos activos en este momento
          </p>
        )}
      </Card>
    </Space>
  );
};

export default ProductionDashboard;