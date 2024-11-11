// processService.js
class ProcessService {
    constructor() {
        this.processes = [];
        this.activeProcesses = new Map(); // Mapa de procesos activos: processId -> processState
        this.selectedProcessId = null;
        this.subscribers = new Set();
    }

    // Estructura del estado de un proceso individual
    createProcessState(process) {
        return {
            process,
            steps: [],
            events: [],
            currentStepIndex: 0,
            elapsedTime: 0,
            isRunning: false,
            intervalId: null
        };
    }

    subscribe(callback) {
        this.subscribers.add(callback);
        return () => this.subscribers.delete(callback);
    }

    notifySubscribers() {
        const currentState = this.getState();
        this.subscribers.forEach(callback => callback(currentState));
    }

    getState() {
        const selectedProcessState = this.selectedProcessId 
            ? this.activeProcesses.get(this.selectedProcessId)
            : null;

        return {
            processes: this.processes,
            selectedProcess: selectedProcessState?.process || null,
            processSteps: selectedProcessState?.steps || [],
            processEvents: selectedProcessState?.events || [],
            currentStepIndex: selectedProcessState?.currentStepIndex || 0,
            elapsedTime: selectedProcessState?.elapsedTime || 0,
            isRunning: selectedProcessState?.isRunning || false,
            activeProcessIds: Array.from(this.activeProcesses.keys())
        };
    }

    async loadProcesses() {
        try {
            this.processes = await window.api.database.getProductionProcesses();
            this.notifySubscribers();
        } catch (error) {
            console.error('Error loading processes:', error);
        }
    }

    async selectProcess(processId) {
        this.selectedProcessId = processId;
        
        // Si el proceso no está en activeProcesses, cárgalo
        if (!this.activeProcesses.has(processId)) {
            const process = this.processes.find(p => p.id === processId);
            if (process) {
                this.activeProcesses.set(processId, this.createProcessState(process));
                await this.loadProcessDetails(processId);
            }
        }
        
        this.notifySubscribers();
    }

    async loadProcessDetails(processId) {
        const processState = this.activeProcesses.get(processId);
        if (!processState) return;

        try {
            // Cargar pasos del proceso
            const steps = await window.api.database.getProcessSteps(processState.process.recipe_id);
            const enrichedSteps = steps.map(step => ({
                ...step,
                status: 'pending',
                startTime: null,
                endTime: null,
                actualDuration: 0,
                progress: 0
            }));

            // Cargar eventos existentes
            const events = await window.api.database.getProcessEvents(processId);

            // Actualizar el estado del proceso
            processState.steps = enrichedSteps;
            processState.events = events;

            this.notifySubscribers();
        } catch (error) {
            console.error('Error loading process details:', error);
        }
    }

    toggleProcess(processId) {
        const processState = this.activeProcesses.get(processId || this.selectedProcessId);
        if (!processState) return;

        processState.isRunning = !processState.isRunning;
        
        if (processState.isRunning) {
            this.startProcessTracking(processId || this.selectedProcessId);
        } else {
            this.stopProcessTracking(processId || this.selectedProcessId);
        }
        
        this.notifySubscribers();
    }

    startProcessTracking(processId) {
        const processState = this.activeProcesses.get(processId);
        if (!processState || processState.intervalId) return;

        processState.intervalId = setInterval(async () => {
            if (processState.currentStepIndex >= processState.steps.length) {
                this.stopProcessTracking(processId);
                return;
            }

            processState.elapsedTime += 1;
            const currentStep = processState.steps[processState.currentStepIndex];

            // Iniciar paso si aún no ha comenzado
            if (!currentStep.startTime) {
                await this.startStep(processId, currentStep);
            }

            // Actualizar progreso
            await this.updateStepProgress(processId, currentStep);

            this.notifySubscribers();
        }, 1000);
    }

    async startStep(processId, step) {
        const processState = this.activeProcesses.get(processId);
        if (!processState) return;

        const startEvent = {
            process_id: processId,
            event_time: new Date(),
            description: `Iniciando paso: ${step.title}`,
            status: 'info'
        };

        await window.api.database.addProcessEvent(startEvent);
        processState.events.push(startEvent);

        step.status = 'in_progress';
        step.startTime = new Date();
    }

    async startProcess(processId) {
        const process = this.processes.find(p => p.id === processId);
        if (!process) return;

        const processState = this.createProcessState(process);
        this.activeProcesses.set(processId, processState);
        
        await window.api.database.updateProductionProcess(processId, {
            status: 'in_progress',
            actual_start_time: new Date().toISOString()
        });

        await window.api.database.addProcessEvent({
            process_id: processId,
            event_time: new Date().toISOString(),
            description: 'Proceso iniciado',
            status: 'in_progress'
        });

        this.startProcessTracking(processId);
        this.notifySubscribers();
    }

    async pauseProcess(processId) {
        const processState = this.activeProcesses.get(processId);
        if (!processState) return;

        this.stopProcessTracking(processId);
        processState.isRunning = false;

        await window.api.database.updateProductionProcess(processId, {
            status: 'paused'
        });

        await window.api.database.addProcessEvent({
            process_id: processId,
            event_time: new Date().toISOString(),
            description: 'Proceso pausado',
            status: 'paused'
        });

        this.notifySubscribers();
    }

    async resumeProcess(processId) {
        const processState = this.activeProcesses.get(processId);
        if (!processState) return;

        await window.api.database.updateProductionProcess(processId, {
            status: 'in_progress'
        });

        await window.api.database.addProcessEvent({
            process_id: processId,
            event_time: new Date().toISOString(),
            description: 'Proceso reanudado',
            status: 'in_progress'
        });

        this.startProcessTracking(processId);
        this.notifySubscribers();
    }

    async completeProcess(processId) {
        const processState = this.activeProcesses.get(processId);
        if (!processState) return;

        this.stopProcessTracking(processId);

        await window.api.database.updateProductionProcess(processId, {
            status: 'completed',
            actual_end_time: new Date().toISOString(),
            progress: 100
        });

        await window.api.database.addProcessEvent({
            process_id: processId,
            event_time: new Date().toISOString(),
            description: 'Proceso completado',
            status: 'completed'
        });

        this.activeProcesses.delete(processId);
        this.notifySubscribers();
    }

    async cancelProcess(processId) {
        this.stopProcessTracking(processId);

        await window.api.database.updateProductionProcess(processId, {
            status: 'cancelled'
        });

        await window.api.database.addProcessEvent({
            process_id: processId,
            event_time: new Date().toISOString(),
            description: 'Proceso cancelado',
            status: 'cancelled'
        });

        this.activeProcesses.delete(processId);
        this.notifySubscribers();
    }

    async updateStepProgress(processId, step) {
        const processState = this.activeProcesses.get(processId);
        if (!processState) return;

        const estimatedStepTime = step.estimated_time * 60;
        const progressPercentage = Math.min(
            (processState.elapsedTime / estimatedStepTime) * 100,
            100
        );

        step.progress = Math.round(progressPercentage);

        if (processState.elapsedTime >= estimatedStepTime) {
            await this.completeStep(processId, step);
        }
    }

    async completeStep(processId, step) {
        const processState = this.activeProcesses.get(processId);
        if (!processState) return;

        const completionEvent = {
            process_id: processId,
            event_time: new Date(),
            description: `Completado paso: ${step.title}`,
            status: 'success'
        };

        await window.api.database.addProcessEvent(completionEvent);
        processState.events.push(completionEvent);

        step.status = 'completed';
        step.endTime = new Date();
        step.actualDuration = processState.elapsedTime;
        step.progress = 100;

        const processProgress = Math.round(
            ((processState.currentStepIndex + 1) / processState.steps.length) * 100
        );

        await window.api.database.updateProductionProcess(
            processId,
            { progress: processProgress }
        );

        processState.currentStepIndex += 1;
        processState.elapsedTime = 0;
    }

    // Método para calcular progreso global del proceso
    calculateProcessProgress(processId) {
        const processState = this.activeProcesses.get(processId);
        if (!processState || !processState.steps.length) return 0;

        const totalSteps = processState.steps.length;
        const completedSteps = processState.steps.filter(step => step.status === 'completed').length;

        return Math.round((completedSteps / totalSteps) * 100);
    }

    stopProcessTracking(processId) {
        const processState = this.activeProcesses.get(processId);
        if (processState?.intervalId) {
            clearInterval(processState.intervalId);
            processState.intervalId = null;
        }
    }

    // Método para detener un proceso específico
    stopProcess(processId) {
        this.stopProcessTracking(processId);
        this.activeProcesses.delete(processId);
        this.notifySubscribers();
    }

    // Cleanup
    destroy() {
        this.activeProcesses.forEach((_, processId) => {
            this.stopProcessTracking(processId);
        });
        this.activeProcesses.clear();
        this.subscribers.clear();
    }
}

export const processService = new ProcessService();