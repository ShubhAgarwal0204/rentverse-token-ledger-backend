import { Router, Request, Response, NextFunction } from 'express';
import { TokenLedgerContract } from '../ledger/TokenLedgerContract';

const router = Router();

const contract = new TokenLedgerContract({
  name: process.env.TOKEN_NAME || 'RentVerse Token',
  symbol: process.env.TOKEN_SYMBOL || 'RVT',
  decimals: Number(process.env.TOKEN_DECIMALS || 18),
  owner: process.env.TOKEN_OWNER_ADDRESS || null,
});

function requireAdminKeyIfConfigured(req: Request, res: Response, next: NextFunction) {
  const configuredKey = process.env.ADMIN_API_KEY;
  if (!configuredKey) return next();
  if (req.header('x-admin-key') !== configuredKey) {
    return res.status(401).json({ error: 'Missing or invalid x-admin-key header' });
  }
  next();
}

router.get('/state', (req: Request, res: Response) => {
  res.json(contract.getState());
});

router.get('/balance/:address', (req: Request, res: Response) => {
  try {
    const balance = contract.balanceOf(req.params.address);
    res.json({ address: req.params.address, balance, symbol: contract.symbol });
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

router.post('/mint', requireAdminKeyIfConfigured, (req: Request, res: Response) => {
  try {
    const { to, amount, from } = req.body;
    const block = contract.mint(to, Number(amount), from);
    res.status(201).json({
      message: `Minted ${amount} ${contract.symbol} to ${to}`,
      transaction: block,
      totalSupply: contract.totalSupply,
    });
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

router.post('/transfer', (req: Request, res: Response) => {
  try {
    const { from, to, amount } = req.body;
    const block = contract.transfer(from, to, Number(amount));
    res.status(201).json({
      message: `Transferred ${amount} ${contract.symbol} from ${from} to ${to}`,
      transaction: block,
    });
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

router.get('/transactions', (req: Request, res: Response) => {
  const address = req.query.address as string | undefined;
  res.json({ transactions: contract.getTransactions(address) });
});

router.get('/verify', (req: Request, res: Response) => {
  res.json({ valid: contract.isChainValid() });
});

export default router;
