import React, { useState, useEffect } from 'react';
import { processService } from './processService';
import {
    Card,
    Select,
    Row,
    Col,
    Progress,
    Timeline,
    Typography,
    Button,
    Tag
} from 'antd';
import {
    PlayCircleOutlined,
    PauseCircleOutlined,
    CloseCircleOutlined
} from '@ant-design/icons';
import moment from 'moment';

const { Title, Text } = Typography;
const { Option } = Select;

const ProcessMapping = () => {
    const [state, setState] = useState(processService.getState());
    const {
        processes,
        selectedProcess,
        processSteps,
        processEvents,
        isRunning,
        currentStepIndex,
        activeProcessIds
    } = state;

    useEffect(() => {
        const unsubscribe = processService.subscribe(setState);
        processService.loadProcesses();
        return () => unsubscribe();
    }, []);

    const handleProcessSelect = (processId) => {
        processService.selectProcess(processId);
    };

    const toggleProcess = () => {
        if (selectedProcess) {
            processService.toggleProcess(selectedProcess.id);
        }
    };

    const stopProcess = (processId) => {
        processService.stopProcess(processId);
    };

    const calculateStepProgress = (step) => {
        switch (step.status) {
            case 'pending':
                return 0;
            case 'in_progress':
                return step.progress || 0;
            case 'completed':
                return 100;
            default:
                return 0;
        }
    };

    const getStepStatus = (step) => {
        switch (step.status) {
            case 'pending': return 'normal';
            case 'in_progress': return 'active';
            case 'completed': return 'success';
            default: return 'normal';
        }
    };

    const ProcessEvents = ({ events }) => (
        <Card title="Eventos del Proceso" style={{ height: '400px', overflowY: 'auto' }}>
            <Timeline>
                {events.map((event, index) => (
                    <Timeline.Item
                        key={index}
                        color={
                            event.status === 'info' ? 'blue' :
                            event.status === 'success' ? 'green' :
                            event.status === 'warning' ? 'orange' : 'red'
                        }
                    >
                        <Text>{event.description}</Text>
                        <br />
                        <Text type="secondary">
                            {moment(event.event_time).format('YYYY-MM-DD HH:mm:ss')}
                        </Text>
                    </Timeline.Item>
                ))}
            </Timeline>
        </Card>
    );

    return (
        <Card title="Mapeo Detallado de Procesos">
            <Row gutter={16} style={{ marginBottom: 20 }}>
                <Col span={12}>
                    <Select
                        style={{ width: '100%' }}
                        placeholder="Seleccionar Proceso"
                        value={selectedProcess?.id}
                        onChange={handleProcessSelect}
                    >
                        {processes.map(process => (
                            <Option key={process.id} value={process.id}>
                                {process.batch_number} - {process.recipe_name}
                                {activeProcessIds.includes(process.id) && (
                                    <Tag color="green" style={{ marginLeft: 8 }}>Activo</Tag>
                                )}
                            </Option>
                        ))}
                    </Select>
                </Col>
                {selectedProcess && (
                    <Col span={12}>
                        <Row justify="end" gutter={16}>
                            <Col>
                                <Button
                                    type="primary"
                                    icon={isRunning ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
                                    onClick={toggleProcess}
                                >
                                    {isRunning ? 'Pausar' : 'Iniciar'} Proceso
                                </Button>
                                <Button
                                    type="danger"
                                    icon={<CloseCircleOutlined />}
                                    onClick={() => stopProcess(selectedProcess.id)}
                                    style={{ marginLeft: 8 }}
                                >
                                    Detener Proceso
                                </Button>
                            </Col>
                        </Row>
                    </Col>
                )}
            </Row>

            {selectedProcess && (
                <Row gutter={16} style={{ marginTop: 20 }}>
                    <Col span={16}>
                        <Title level={4}>Pasos del Proceso</Title>
                        <Timeline>
                            {processSteps.map((step, index) => (
                                <Timeline.Item
                                    key={step.id}
                                    color={
                                        index === currentStepIndex ? 'blue' :
                                        step.status === 'completed' ? 'green' : 'gray'
                                    }
                                >
                                    <Row align="middle" gutter={8}>
                                        <Col span={16}>
                                            <Text strong>{step.title}</Text>
                                            <div>{step.description}</div>
                                        </Col>
                                        <Col span={8}>
                                            <Progress
                                                percent={calculateStepProgress(step)}
                                                status={getStepStatus(step)}
                                            />
                                        </Col>
                                    </Row>
                                </Timeline.Item>
                            ))}
                        </Timeline>
                    </Col>
                    <Col span={8}>
                        <ProcessEvents events={processEvents} />
                    </Col>
                </Row>
            )}
        </Card>
    );
};

export default ProcessMapping;