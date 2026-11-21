import React, { useState } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import ChatView from './components/ChatView';
import CustomDashboard from './components/CustomDashboard';
import { uploadDataset, sendChatMessage } from './services/api';

export default function App() {
  const [currentView, setCurrentView] = useState('chat'); // 'chat' | 'dashboard'
  const [dataset, setDataset] = useState(null);
  const [messages, setMessages] = useState([]);
  const [pinnedCharts, setPinnedCharts] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Upload dataset handler
  const handleFileUpload = async (file) => {
    setIsUploading(true);
    setError(null);
    try {
      const data = await uploadDataset(file);
      setDataset(data);

      const welcomeMsg = {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: `I've successfully loaded **${data.filename}** with **${data.profile.total_rows.toLocaleString()}** rows and **${data.profile.total_columns}** columns. All numerical columns have been cleaned. You can ask specific queries or ask me to **"Make a full dashboard"**!`,
        charts: [],
        chart_json: null,
        report_title: null,
        generated_code: '',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, welcomeMsg]);
      setCurrentView('chat');
    } catch (err) {
      console.error('File upload error:', err);
      const msg = err.response?.data?.detail || err.message || 'Failed to upload dataset.';
      setError(`Upload failed: ${msg}`);
    } finally {
      setIsUploading(false);
    }
  };

  // Detach dataset to return to pure general chat
  const handleClearDataset = () => {
    setDataset(null);
    const infoMsg = {
      id: `msg-${Date.now()}`,
      role: 'assistant',
      content: 'Dataset detached. DataTalk AI is now running in General Chat Mode. You can ask general questions or click "+" to attach another dataset anytime.',
      charts: [],
      chart_json: null,
      report_title: null,
      generated_code: '',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, infoMsg]);
  };

  // Chat message send handler (works both WITH and WITHOUT dataset)
  const handleSendMessage = async (queryText) => {
    const userMsg = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: queryText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);
    setError(null);

    try {
      const sessionId = dataset?.session_id || null;
      const response = await sendChatMessage(sessionId, queryText);

      // Extract charts list
      const chartsArray = Array.isArray(response.charts) && response.charts.length > 0
        ? response.charts
        : (response.chart_json ? [response.chart_json] : []);

      const botMsg = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        query: queryText,
        content: response.answer,
        charts: chartsArray,
        chart_json: response.chart_json || (chartsArray[0] || null),
        report_title: response.report_title || null,
        generated_code: response.generated_code || '',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      console.error('Chat error:', err);
      const detail = err.response?.data?.detail || err.message || 'An unexpected error occurred.';
      setError(`Error: ${detail}`);

      const errorBotMsg = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: `⚠️ Sorry, I encountered an issue processing your request:\n\n${detail}`,
        charts: [],
        chart_json: null,
        report_title: null,
        generated_code: '',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorBotMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  // Pin individual chart item
  const handlePinChart = (chartItem) => {
    if (!chartItem.chart_json) return;

    setPinnedCharts((prev) => {
      const exists = prev.some((item) => item.id === chartItem.id);
      if (exists) {
        return prev.filter((item) => item.id !== chartItem.id);
      } else {
        return [
          ...prev,
          {
            id: chartItem.id,
            query: chartItem.query || 'Visual Insight',
            answer: chartItem.answer,
            chart_json: chartItem.chart_json,
            timestamp: chartItem.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ];
      }
    });
  };

  // One-click Pin All Charts to Dashboard
  const handlePinAllCharts = (message, chartList) => {
    if (!chartList || chartList.length === 0) return;

    setPinnedCharts((prev) => {
      const existingIds = new Set(prev.map((item) => item.id));
      const newItems = [];

      chartList.forEach((chartJson, idx) => {
        const chartId = `${message.id}-chart-${idx}`;
        if (!existingIds.has(chartId)) {
          newItems.push({
            id: chartId,
            query: `${message.report_title || message.query || 'Dashboard View'} (${idx + 1})`,
            answer: message.content,
            chart_json: chartJson,
            timestamp: message.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          });
        }
      });

      return [...prev, ...newItems];
    });
  };

  // Remove chart from dashboard
  const handleRemoveChart = (chartId) => {
    setPinnedCharts((prev) => prev.filter((item) => item.id !== chartId));
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] font-sans antialiased text-slate-800">
      {/* Top Navigation Bar */}
      <Navbar
        currentView={currentView}
        setCurrentView={setCurrentView}
        onFileUpload={handleFileUpload}
        isUploading={isUploading}
        pinnedCount={pinnedCharts.length}
        datasetName={dataset?.filename}
      />

      {/* Main Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Dark Sidebar */}
        <Sidebar
          dataset={dataset}
          onSelectQuestion={handleSendMessage}
          isAnalyzing={isLoading}
        />

        {/* Workspace Canvas */}
        {currentView === 'chat' ? (
          <ChatView
            dataset={dataset}
            onClearDataset={handleClearDataset}
            onFileUpload={handleFileUpload}
            isUploading={isUploading}
            messages={messages}
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
            pinnedCharts={pinnedCharts}
            onPinChart={handlePinChart}
            onPinAllCharts={handlePinAllCharts}
            error={error}
          />
        ) : (
          <CustomDashboard
            dataset={dataset}
            pinnedCharts={pinnedCharts}
            onRemoveChart={handleRemoveChart}
            onGoToChat={() => setCurrentView('chat')}
          />
        )}
      </div>
    </div>
  );
}
