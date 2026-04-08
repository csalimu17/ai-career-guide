'use server';

export async function testAction(): Promise<string> {
  console.log('Test Action Triggered');
  return "SERVER_ACTION_WORKING";
}
