import { fetchAuthSession } from 'aws-amplify/auth';
import { config } from '../app/config';
import { signedPublicGet } from './public-content';

/** Signed-in students always use their own pool's access token; no guest fallback. */
export async function getPublishedCourses(subject: string | null, signal: AbortSignal): Promise<Response> {
  if (!subject) return signedPublicGet({url: config.coursesApi, identityPoolId: config.coursesIdentity, region: config.region}, '/api/public/courses', {signal});
  const session = await fetchAuthSession();
  const token = session.tokens?.accessToken;
  if (!token || token.payload.sub !== subject) throw new Error('Student session changed');
  if (signal.aborted) throw new DOMException('Request cancelled', 'AbortError');
  return fetch(`${config.coursesApi.replace(/\/$/, '')}/api/student/courses`, {
    signal, headers: {Authorization: `Bearer ${token.toString()}`},
  });
}
