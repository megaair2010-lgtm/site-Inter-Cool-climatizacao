import assert from 'node:assert/strict'
import { test } from 'node:test'
import { parseCommand } from '../server/commands'
import { redact } from '../server/redact'

test('redação remove segredos e dados pessoais', () => {
  const out = redact({
    note: 'chave sk-ant-api03-AAAAAAAAAAAAAAAAAAAAAAAA e Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.abcdefghijk',
    contato: 'joao@cliente.com.br / (62) 99999-1234 / CPF 123.456.789-09',
    cartao: '4111 1111 1111 1111',
    cfg: 'password=hunter2 api_key: ghp_ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
  })!
  for (const s of ['sk-ant-api03', 'eyJhbGci', 'joao@cliente', '99999-1234', '123.456.789-09', '4111 1111', 'hunter2', 'ghp_ABC']) {
    assert.ok(!out.includes(s), `vazou: ${s}`)
  }
})

test('redação limita o tamanho', () => {
  assert.ok(redact('x'.repeat(10_000), 100)!.length <= 120)
})

test('comandos: só a lista permitida passa', () => {
  assert.equal(parseCommand({ type: 'order_ceo', text: 'Monte uma campanha' }).ok, true)
  assert.equal(parseCommand({ type: 'shell', cmd: 'rm -rf /' }).ok, false)
  assert.equal(parseCommand({ type: 'cancel_task', taskKey: '../../etc/passwd' }).ok, false)
  assert.equal(parseCommand({ type: 'cancel_task', taskKey: 'ruflo:task-1; rm -rf /' }).ok, false)
  assert.equal(parseCommand({ type: 'order_ceo', text: 'x' }).ok, false)
  assert.equal(parseCommand({ type: 'order_ceo', text: 'ok ok', priority: 'urgentíssima' }).ok, false)
  assert.equal(parseCommand({ type: 'intervene', taskKey: 'ruflo:task-1', note: 'a'.repeat(1001) }).ok, false)
  assert.equal(parseCommand('{"type":"order_ceo"}').ok, false)
})
