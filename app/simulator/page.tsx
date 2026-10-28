import { getDisplayModels } from '@/lib/display-model-data';
import type { DisplayModel } from '@/lib/display-models';
import { SimulatorClient } from './simulator-client';

export default async function SimulatorPage() {
  let models: DisplayModel[] = [];
  try {
    models = await getDisplayModels();
  } catch {
    // The client retries through the public API so a temporary DB read failure
    // does not make the whole route unavailable.
  }
  return <SimulatorClient initialModels={models} />;
}
