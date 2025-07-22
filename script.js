  // Server data with realistic global endpoints
        const servers = [
            { name: 'US East (Virginia)', location: 'us-east-1', flag: '🇺🇸', baseLatency: 45 },
            { name: 'US West (California)', location: 'us-west-1', flag: '🇺🇸', baseLatency: 85 },
            { name: 'Europe (London)', location: 'eu-west-1', flag: '🇬🇧', baseLatency: 120 },
            { name: 'Asia Pacific (Tokyo)', location: 'ap-northeast-1', flag: '🇯🇵', baseLatency: 180 },
            { name: 'South America (São Paulo)', location: 'sa-east-1', flag: '🇧🇷', baseLatency: 200 },
            { name: 'Australia (Sydney)', location: 'ap-southeast-2', flag: '🇦🇺', baseLatency: 250 },
            { name: 'Canada (Central)', location: 'ca-central-1', flag: '🇨🇦', baseLatency: 65 },
            { name: 'Asia Pacific (Singapore)', location: 'ap-southeast-1', flag: '🇸🇬', baseLatency: 160 }
        ];

        let pingData = {};
        let historyData = [];
        let totalPings = 0;
        let alertCount = 0;
        let autoRefreshInterval = null;
        let latencyChart = null;
        let historyChart = null;

        // Initialize charts
        function initCharts() {
            // Latency bar chart
            const ctx1 = document.getElementById('latencyChart').getContext('2d');
            latencyChart = new Chart(ctx1, {
                type: 'bar',
                data: {
                    labels: servers.map(s => s.name),
                    datasets: [{
                        label: 'Latency (ms)',
                        data: Array(servers.length).fill(0),
                        backgroundColor: servers.map(() => 'rgba(255, 255, 255, 0.8)'),
                        borderColor: servers.map(() => 'rgba(255, 255, 255, 1)'),
                        borderWidth: 2,
                        borderRadius: 8
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            labels: { color: 'white' }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: { color: 'white' },
                            grid: { color: 'rgba(255, 255, 255, 0.1)' }
                        },
                        x: {
                            ticks: { 
                                color: 'white',
                                maxRotation: 45
                            },
                            grid: { color: 'rgba(255, 255, 255, 0.1)' }
                        }
                    }
                }
            });

            // History line chart
            const ctx2 = document.getElementById('historyChart').getContext('2d');
            historyChart = new Chart(ctx2, {
                type: 'line',
                data: {
                    labels: [],
                    datasets: servers.map((server, index) => ({
                        label: server.name,
                        data: [],
                        borderColor: `rgba(${255 - (index * 25)}, ${255 - (index * 25)}, ${255 - (index * 25)}, 1)`,
                        backgroundColor: `rgba(${255 - (index * 25)}, ${255 - (index * 25)}, ${255 - (index * 25)}, 0.1)`,
                        tension: 0.4,
                        fill: false,
                        pointRadius: 3
                    }))
                },
                options: {
                    responsive: true,
                    interaction: {
                        intersect: false,
                        mode: 'index'
                    },
                    plugins: {
                        legend: {
                            labels: { color: 'white' }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: { color: 'white' },
                            grid: { color: 'rgba(255, 255, 255, 0.1)' }
                        },
                        x: {
                            ticks: { color: 'white' },
                            grid: { color: 'rgba(255, 255, 255, 0.1)' }
                        }
                    }
                }
            });
        }

        // Simulate ping with realistic latency variations
        function simulatePing(server) {
            const variance = Math.random() * 40 - 20; // ±20ms variance
            const networkJitter = Math.random() * 30; // Additional jitter
            const latency = Math.max(1, Math.round(server.baseLatency + variance + networkJitter));
            
            return {
                ...server,
                latency,
                status: getLatencyStatus(latency),
                timestamp: new Date()
            };
        }

        function getLatencyStatus(latency) {
            if (latency < 50) return 'excellent';
            if (latency < 100) return 'good';
            if (latency < 200) return 'fair';
            return 'poor';
        }

        function getLatencyColor(status) {
            const colors = {
                excellent: 'rgba(255, 255, 255, 0.9)',
                good: 'rgba(204, 204, 204, 0.9)',
                fair: 'rgba(136, 136, 136, 0.9)',
                poor: 'rgba(68, 68, 68, 0.9)'
            };
            return colors[status] || colors.excellent;
        }

        function createPingAnimation(x, y) {
            const ping = document.createElement('div');
            ping.className = 'ping-animation';
            ping.textContent = '📡';
            ping.style.left = x + 'px';
            ping.style.top = y + 'px';
            document.body.appendChild(ping);
            
            setTimeout(() => {
                document.body.removeChild(ping);
            }, 2000);
        }

        async function pingAllServers() {
            const spinner = document.getElementById('loadingSpinner');
            spinner.style.display = 'block';
            
            // Create ping animations
            for (let i = 0; i < 5; i++) {
                setTimeout(() => {
                    createPingAnimation(
                        Math.random() * window.innerWidth,
                        Math.random() * window.innerHeight
                    );
                }, i * 200);
            }

            // Simulate network delay
            await new Promise(resolve => setTimeout(resolve, 1500));

            const results = servers.map(simulatePing);
            updatePingData(results);
            
            spinner.style.display = 'none';
            totalPings++;
            updateStats();
        }

        function updatePingData(results) {
            results.forEach(result => {
                pingData[result.location] = result;
                
                // Check for high latency alerts
                if (result.latency > 200 && result.status === 'poor') {
                    showAlert(`High latency detected: ${result.name} (${result.latency}ms)`);
                    alertCount++;
                }
            });

            updateCharts();
            updateServerList();
            updateHistory();
        }

        function updateCharts() {
            const latencies = servers.map(server => 
                pingData[server.location]?.latency || 0
            );
            const colors = servers.map(server => 
                getLatencyColor(pingData[server.location]?.status || 'excellent')
            );

            latencyChart.data.datasets[0].data = latencies;
            latencyChart.data.datasets[0].backgroundColor = colors;
            latencyChart.update('none');
        }

        function updateServerList() {
            const serverList = document.getElementById('serverList');
            serverList.innerHTML = '';

            servers.forEach(server => {
                const ping = pingData[server.location];
                const item = document.createElement('div');
                item.className = 'server-item';
                
                const status = ping?.status || 'excellent';
                const latency = ping?.latency || 0;
                
                item.innerHTML = `
                    <div class="server-info">
                        <div class="status-dot status-${status}"></div>
                        <span>${server.flag} ${server.name}</span>
                    </div>
                    <div class="latency-value" style="background: ${getLatencyColor(status)}">
                        ${latency}ms
                    </div>
                `;
                
                serverList.appendChild(item);
            });
        }

        function updateHistory() {
            const timestamp = new Date().toLocaleTimeString();
            historyData.push(timestamp);
            
            // Keep only last 10 data points
            if (historyData.length > 10) {
                historyData.shift();
            }

            historyChart.data.labels = historyData;
            
            servers.forEach((server, index) => {
                const latency = pingData[server.location]?.latency || 0;
                historyChart.data.datasets[index].data.push(latency);
                
                // Keep only last 10 data points
                if (historyChart.data.datasets[index].data.length > 10) {
                    historyChart.data.datasets[index].data.shift();
                }
            });
            
            historyChart.update('none');
        }

        function updateStats() {
            const latencies = Object.values(pingData).map(p => p.latency).filter(Boolean);
            const avgLatency = latencies.length > 0 ? 
                Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length) : 0;
            const activeServers = latencies.length;

            document.getElementById('avgLatency').textContent = avgLatency + 'ms';
            document.getElementById('activeServers').textContent = activeServers;
            document.getElementById('totalPings').textContent = totalPings;
            document.getElementById('alertCount').textContent = alertCount;
        }

        function showAlert(message) {
            const alert = document.createElement('div');
            alert.className = 'alert alert-danger';
            alert.textContent = message;
            document.body.appendChild(alert);
            
            setTimeout(() => alert.classList.add('show'), 100);
            setTimeout(() => {
                alert.classList.remove('show');
                setTimeout(() => document.body.removeChild(alert), 300);
            }, 4000);
        }

        function toggleAutoRefresh() {
            if (autoRefreshInterval) {
                clearInterval(autoRefreshInterval);
                autoRefreshInterval = null;
                showAlert('Auto-refresh disabled');
            } else {
                autoRefreshInterval = setInterval(pingAllServers, 5000);
                showAlert('Auto-refresh enabled (5s interval)');
            }
        }

        function resetStats() {
            pingData = {};
            historyData = [];
            totalPings = 0;
            alertCount = 0;
            
            latencyChart.data.datasets[0].data = Array(servers.length).fill(0);
            latencyChart.data.datasets[0].backgroundColor = servers.map(() => 'rgba(255, 255, 255, 0.8)');
            latencyChart.update();
            
            historyChart.data.labels = [];
            historyChart.data.datasets.forEach(dataset => {
                dataset.data = [];
            });
            historyChart.update();
            
            updateStats();
            updateServerList();
            showAlert('Statistics reset successfully');
        }

        // Initialize everything when page loads
        document.addEventListener('DOMContentLoaded', function() {
            initCharts();
            updateServerList();
            
            // Run initial ping after 1 second
            setTimeout(pingAllServers, 1000);
        });