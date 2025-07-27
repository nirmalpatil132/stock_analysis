const chartManager = {
    chart: null,
    series: null,

    initChart(containerId) {
        const chartContainer = document.getElementById(containerId);
        this.chart = LightweightCharts.createChart(chartContainer, {
            width: chartContainer.clientWidth,
            height: chartContainer.clientHeight,
            layout: {
                backgroundColor: '#1e222d',
                textColor: '#d1d4dc',
            },
            grid: {
                vertLines: { color: '#2a2e39' },
                horzLines: { color: '#2a2e39' },
            },
            crosshair: {
                mode: LightweightCharts.CrosshairMode.Normal,
            },
            timeScale: {
                borderColor: '#2a2e39',
            },
        });

        this.series = this.chart.addCandlestickSeries({
            upColor: '#26a69a',
            downColor: '#ef5350',
            borderDownColor: '#ef5350',
            borderUpColor: '#26a69a',
            wickDownColor: '#ef5350',
            wickUpColor: '#26a69a',
        });

        new ResizeObserver(entries => {
            if (entries.length === 0 || entries[0].target !== chartContainer) { return; }
            const { width, height } = entries[0].contentRect;
            this.chart.applyOptions({ width, height });
        }).observe(chartContainer);
    },

    setChartData(historicalData) {
        if (!this.series) return;
        this.series.setData(historicalData);
        this.chart.timeScale().fitContent();
    },

    updateChart(realtimeData) {
        if (!this.series) return;
        this.series.update(realtimeData);
    },
};