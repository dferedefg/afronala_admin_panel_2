import {
  CloudRpcResponse,
  SuperAppClassSyncAuditRow,
  SuperAppMonorepoManifest,
  SuperAppRuntimeConfig,
} from '../types';
import { back4AppService } from './back4app';

class SuperAppBridgeService {
  private headers(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'x-admin-role': back4AppService.getAdminRole(),
    };
  }

  async callCloudFunction<T = any>(
    functionName: string,
    params: Record<string, any> = {}
  ): Promise<CloudRpcResponse<T>> {
    const res = await fetch(`/api/back4app/functions/${encodeURIComponent(functionName)}`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify(params),
    });

    const json = await res.json();
    if (!res.ok) {
      throw new Error(json?.error || `Failed to invoke Cloud Function ${functionName}`);
    }
    return json as CloudRpcResponse<T>;
  }

  async getParseConfig(): Promise<{ source: string; params: SuperAppRuntimeConfig }> {
    const res = await fetch('/api/back4app/config', {
      headers: this.headers(),
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json?.error || 'Unable to load Parse runtime config');
    }
    return json;
  }

  async updateParseConfig(
    partial: Partial<SuperAppRuntimeConfig>
  ): Promise<{ success: boolean; persistedToBack4App: boolean; params: SuperAppRuntimeConfig }> {
    const res = await fetch('/api/back4app/config', {
      method: 'PUT',
      headers: this.headers(),
      body: JSON.stringify({ params: partial }),
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json?.error || 'Unable to update Parse runtime config');
    }
    return json;
  }

  async getMonorepoManifest(): Promise<SuperAppMonorepoManifest> {
    const res = await fetch('/api/superapp/monorepo/manifest', {
      headers: this.headers(),
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json?.error || 'Unable to read SuperApp monorepo archive');
    }
    return json as SuperAppMonorepoManifest;
  }

  async readArchiveFile(filePath: string): Promise<{ path: string; sizeBytes: number; content: string }> {
    const res = await fetch(`/api/superapp/monorepo/file?path=${encodeURIComponent(filePath)}`, {
      headers: this.headers(),
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json?.error || `Unable to read file ${filePath}`);
    }
    return json;
  }

  async runSchemaSyncAudit(): Promise<{ auditedAt: string; rows: SuperAppClassSyncAuditRow[] }> {
    const res = await fetch('/api/superapp/monorepo/sync-audit', {
      method: 'POST',
      headers: this.headers(),
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json?.error || 'Unable to execute Back4App schema sync audit');
    }
    return json;
  }

  async getUploadedClassesManifest(): Promise<import('../types').Back4AppUploadedClassesManifest> {
    const res = await fetch('/api/back4app/uploaded-classes', {
      headers: this.headers(),
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json?.error || 'Unable to load Back4App uploaded classes manifest');
    }
    return json;
  }

  async getUploadedClassRecords(className: string, country?: string): Promise<import('../types').Back4AppClassDetailResponse> {
    const url = country && country !== 'ALL'
      ? `/api/back4app/uploaded-classes/${encodeURIComponent(className)}?country=${encodeURIComponent(country)}`
      : `/api/back4app/uploaded-classes/${encodeURIComponent(className)}`;
    const res = await fetch(url, {
      headers: this.headers(),
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json?.error || `Unable to load records for class ${className}`);
    }
    return json;
  }

  async rescanUploadedClasses(): Promise<{ success: boolean; message: string; manifest: import('../types').Back4AppUploadedClassesManifest }> {
    const res = await fetch('/api/back4app/uploaded-classes/rescan', {
      method: 'POST',
      headers: this.headers(),
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json?.error || 'Unable to rescan Back4App uploaded classes');
    }
    return json;
  }
}

export const superAppBridgeService = new SuperAppBridgeService();

