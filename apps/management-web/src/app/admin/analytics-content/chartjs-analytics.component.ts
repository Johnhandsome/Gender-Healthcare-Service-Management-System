import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../supabase.service';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import {
  Chart,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
} from 'chart.js';

// Register Chart.js components
Chart.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
);

@Component({
  selector: 'app-chartjs-analytics',
  standalone: true,
  imports: [CommonModule, FormsModule, BaseChartDirective],
  template: `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 w-full">
      <!-- Loading State -->
      <div *ngIf="isLoading" class="fixed inset-0 flex items-center justify-center bg-white bg-opacity-70 z-50">
        <div class="relative">
          <div class="animate-spin rounded-full h-16 w-16 border-4 border-blue-200"></div>
          <div class="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent absolute top-0 left-0"></div>
        </div>
      </div>

      <!-- Error State -->
      <div *ngIf="hasError && !isLoading" class="max-w-lg mx-auto bg-white border border-red-300 rounded-xl p-6 shadow-xl flex items-center space-x-4">
        <div class="bg-red-100 rounded-xl flex items-center justify-center w-10 h-10">
          <svg class="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        </div>
        <div>
          <h3 class="text-xl font-bold text-red-800">Error Loading Analytics</h3>
          <p class="text-red-600 text-sm">{{ errorMessage }}</p>
          <button
            (click)="retryLoadData()"
            class="inline-flex items-center px-4 py-2 mt-4 bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold rounded-xl shadow hover:from-red-600 hover:to-red-700 transition-all duration-200">
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 5.636l-1.414 1.414M6.343 17.657l-1.414-1.414M5.636 5.636l1.414 1.414M17.657 17.657l1.414-1.414"></path>
            </svg>
            Retry
          </button>
        </div>
      </div>

      <!-- Charts Grid -->
      <div *ngIf="!isLoading && !hasError" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
        <!-- Patient Growth Chart -->
        <section class="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden flex flex-col">
          <header class="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex items-center space-x-4">
            <div class="bg-blue-100 rounded-xl flex items-center justify-center w-10 h-10">
              <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 17v-6a4 4 0 014-4h10a4 4 0 014 4v6"></path>
              </svg>
            </div>
            <div>
              <h2 class="text-xl font-bold text-white">Patient Growth Trends</h2>
              <p class="text-sm text-blue-100">Monthly Growth</p>
            </div>
          </header>
          <div class="p-6 flex-1">
            <canvas
              baseChart
              [data]="patientGrowthChartData"
              [options]="lineChartOptions"
              type="line"
              class="w-full h-80"></canvas>
          </div>
        </section>

        <!-- Revenue Analytics Chart -->
        <section class="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden flex flex-col">
          <header class="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-4 flex items-center space-x-4">
            <div class="bg-green-100 rounded-xl flex items-center justify-center w-10 h-10">
              <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <div>
              <h2 class="text-xl font-bold text-white">Revenue Analytics</h2>
              <p class="text-sm text-green-100">Monthly Revenue</p>
            </div>
          </header>
          <div class="p-6 flex-1">
            <canvas
              baseChart
              [data]="revenueChartData"
              [options]="barChartOptions"
              type="bar"
              class="w-full h-80"></canvas>
          </div>
        </section>

        <!-- Age Distribution Chart -->
        <section class="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden flex flex-col">
          <header class="bg-gradient-to-r from-purple-500 to-pink-600 px-6 py-4 flex items-center space-x-4">
            <div class="bg-purple-100 rounded-xl flex items-center justify-center w-10 h-10">
              <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" fill="none"/>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 14s1.5 2 4 2 4-2 4-2"></path>
              </svg>
            </div>
            <div>
              <h2 class="text-xl font-bold text-white">Age Distribution</h2>
              <p class="text-sm text-purple-100">Patient Demographics</p>
            </div>
          </header>
          <div class="p-6 flex-1">
            <canvas
              baseChart
              [data]="ageDistributionChartData"
              [options]="pieChartOptions"
              type="pie"
              class="w-full h-80"></canvas>
          </div>
        </section>

        <!-- Gender Distribution Chart -->
        <section class="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden flex flex-col">
          <header class="bg-gradient-to-r from-blue-500 to-cyan-600 px-6 py-4 flex items-center space-x-4">
            <div class="bg-blue-100 rounded-xl flex items-center justify-center w-10 h-10">
              <svg class="w-6 h-6 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4z"></path>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6.343 17.657A8 8 0 0112 16a8 8 0 015.657 1.657"></path>
              </svg>
            </div>
            <div>
              <h2 class="text-xl font-bold text-white">Gender Distribution</h2>
              <p class="text-sm text-blue-100">Patient Demographics</p>
            </div>
          </header>
          <div class="p-6 flex-1">
            <canvas
              baseChart
              [data]="genderDistributionChartData"
              [options]="doughnutChartOptions"
              type="doughnut"
              class="w-full h-80"></canvas>
          </div>
        </section>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }

    .animate-spin {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `]
})
export class ChartjsAnalyticsComponent implements OnInit, OnDestroy {
  private supabaseService = inject(SupabaseService);

  // Component state
  isLoading: boolean = true;
  hasError: boolean = false;
  errorMessage: string = '';

  // Chart data
  patientGrowthChartData: ChartData<'line'> = { labels: [], datasets: [] };
  revenueChartData: ChartData<'bar'> = { labels: [], datasets: [] };
  ageDistributionChartData: ChartData<'pie'> = { labels: [], datasets: [] };
  genderDistributionChartData: ChartData<'doughnut'> = { labels: [], datasets: [] };

  // Healthcare color scheme
  healthcareColors = [
    '#6366f1', // Indigo
    '#8b5cf6', // Purple
    '#a855f7', // Purple
    '#c084fc', // Light purple
    '#d8b4fe', // Very light purple
    '#e9d5ff'  // Lightest purple
  ];

  // Chart options
  lineChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: '#f3f4f6'
        }
      },
      x: {
        grid: {
          color: '#f3f4f6'
        }
      }
    }
  };

  barChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: '#f3f4f6'
        }
      },
      x: {
        grid: {
          color: '#f3f4f6'
        }
      }
    }
  };

  pieChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'right'
      }
    }
  };

  doughnutChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'right'
      }
    }
  };

  ngOnInit() {
    this.loadAnalyticsData();
  }

  ngOnDestroy() {
    // Cleanup if needed
  }

  async loadAnalyticsData(): Promise<void> {
    try {
      this.isLoading = true;
      this.hasError = false;

      // Fetch real data from Supabase
      const [patients, staff, ageDistribution, genderDistribution] = await Promise.all([
        this.supabaseService.getPatients(1, 1000),
        this.supabaseService.getStaffMembers(),
        this.supabaseService.getAgeDistribution(),
        this.supabaseService.getGenderDistribution()
      ]);

      // Process and format chart data
      this.formatChartData(patients, staff, ageDistribution, genderDistribution);

      this.isLoading = false;

    } catch (error: any) {
      console.error('Error loading analytics data:', error);
      this.hasError = true;
      this.errorMessage = error.message || 'Failed to load analytics data. Please try again.';
      this.isLoading = false;
    }
  }

  private formatChartData(patients: any, staff: any[], ageDistribution: any, genderDistribution: any) {
    // Patient Growth Chart Data (mock monthly data)
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const growthData = [45, 52, 48, 61, 55, 67];

    this.patientGrowthChartData = {
      labels: months,
      datasets: [{
        label: 'New Patients',
        data: growthData,
        borderColor: this.healthcareColors[0],
        backgroundColor: this.healthcareColors[0] + '20',
        tension: 0.4,
        fill: true
      }]
    };

    // Revenue Chart Data (mock monthly revenue)
    const revenueData = [2500000, 2800000, 2600000, 3100000, 2900000, 3300000];

    this.revenueChartData = {
      labels: months,
      datasets: [{
        label: 'Revenue (VND)',
        data: revenueData,
        backgroundColor: this.healthcareColors.slice(0, months.length),
        borderColor: this.healthcareColors.slice(0, months.length),
        borderWidth: 1
      }]
    };

    // Age Distribution Chart Data
    if (ageDistribution && typeof ageDistribution === 'object') {
      const ageLabels = Object.keys(ageDistribution);
      const ageValues = Object.values(ageDistribution) as number[];

      // Convert raw counts to percentages that sum to 100%
      const percentageValues = this.calculatePercentages(ageValues);

      this.ageDistributionChartData = {
        labels: ageLabels,
        datasets: [{
          data: percentageValues,
          backgroundColor: this.healthcareColors.slice(0, ageLabels.length),
          borderWidth: 2,
          borderColor: '#ffffff'
        }]
      };
    } else {
      // Fallback data
      this.ageDistributionChartData = {
        labels: ['0-18', '19-35', '36-50', '51+'],
        datasets: [{
          data: [40, 30, 20, 10],
          backgroundColor: this.healthcareColors.slice(0, 4),
          borderWidth: 2,
          borderColor: '#ffffff'
        }]
      };
    }

    // Gender Distribution Chart Data
    if (genderDistribution && typeof genderDistribution === 'object') {
      const genderLabels = Object.keys(genderDistribution);
      const genderValues = Object.values(genderDistribution) as number[];

      // Convert raw counts to percentages that sum to 100%
      const percentageValues = this.calculatePercentages(genderValues);

      this.genderDistributionChartData = {
        labels: genderLabels,
        datasets: [{
          data: percentageValues,
          backgroundColor: this.healthcareColors.slice(0, genderLabels.length),
          borderWidth: 2,
          borderColor: '#ffffff'
        }]
      };
    } else {
      // Fallback data
      this.genderDistributionChartData = {
        labels: ['Male', 'Female', 'Other'],
        datasets: [{
          data: [55, 43, 2],
          backgroundColor: this.healthcareColors.slice(0, 3),
          borderWidth: 2,
          borderColor: '#ffffff'
        }]
      };
    }
  }

  /**
   * Calculate percentages that sum to exactly 100%
   * Uses proper rounding and distributes remainder to maintain 100% total
   */
  private calculatePercentages(values: number[]): number[] {
    const total = values.reduce((sum, value) => sum + value, 0);

    if (total === 0) {
      return values.map(() => 0);
    }

    // Calculate raw percentages
    const rawPercentages = values.map(value => (value / total) * 100);

    // Round down to get integer parts
    const roundedValues = rawPercentages.map(percentage => Math.floor(percentage));
    const remainders = rawPercentages.map((percentage, index) => ({
      index,
      remainder: percentage - roundedValues[index]
    }));

    // Calculate how much we need to add to reach 100%
    const currentSum = roundedValues.reduce((sum, value) => sum + value, 0);
    const remainderToDistribute = 100 - currentSum;

    // Sort by remainder (descending) to distribute the remaining percentage points
    remainders.sort((a, b) => b.remainder - a.remainder);

    // Add 1 to the items with the largest remainders
    for (let i = 0; i < remainderToDistribute && i < remainders.length; i++) {
      roundedValues[remainders[i].index] += 1;
    }

    return roundedValues;
  }

  retryLoadData(): void {
    this.hasError = false;
    this.loadAnalyticsData();
  }
}
