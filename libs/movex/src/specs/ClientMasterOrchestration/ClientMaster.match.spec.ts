import { movexClientMasterOrchestrator } from '../util/orchestrator';
import matchReducer, { initialMatchState } from '../resources/matchReducer';
import { computeCheckedState } from '../../lib/util';
import { globalLogsy } from 'movex-core-util';
import { tillNextTick } from '../util/misc';

const orchestrator = movexClientMasterOrchestrator();

beforeAll(() => {
  globalLogsy.disable();
});

afterAll(() => {
  globalLogsy.enable();
});

beforeEach(async () => {
  await orchestrator.unsubscribe();
});

test('works with public actions', async () => {
  const whiteClientId = 'white-client';
  const blackClientId = 'black-client';
  const {
    clients: [whiteClient, blackClient],
  } = orchestrator.orchestrate({
    clientIds: [whiteClientId, blackClientId],
    reducer: matchReducer,
    resourceType: 'game',
  });

  const { rid } = await whiteClient.create(initialMatchState).resolveUnwrap();

  const whiteMovex = whiteClient.bind(rid);
  const blackMovex = blackClient.bind(rid);

  whiteMovex.dispatch({
    type: 'addPlayer',
    payload: {
      playerId: whiteClientId,
    },
  });

  await tillNextTick();

  blackMovex.dispatch({
    type: 'addPlayer',
    payload: {
      playerId: blackClientId,
    },
  });

  await tillNextTick();

  const expected = computeCheckedState({
    ...initialMatchState,
    players: {
      [whiteClientId]: true,
      [blackClientId]: true,
    },
  });

  const actual = whiteMovex.state;

  expect(actual).toEqual(expected);
});
