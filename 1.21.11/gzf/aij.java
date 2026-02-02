import java.time.Instant;

public record aij(String b, Instant c, long d, ek e, yp.b f) implements aay<aib> {
   public static final aao<wx, aij> a = aay.a(aij::a, aij::new);

   private aij(wx $$0) {
      this($$0.p(), $$0.s(), $$0.readLong(), new ek($$0), new yp.b($$0));
   }

   public aij(String param1, Instant param2, long param3, ek param5, yp.b param6) {
      this.b = $$0;
      this.c = $$1;
      this.d = $$2;
      this.e = $$3;
      this.f = $$4;
   }

   private void a(wx $$0) {
      $$0.a(this.b);
      $$0.a(this.c);
      $$0.b(this.d);
      this.e.a($$0);
      this.f.a($$0);
   }

   public aba<aij> a() {
      return ahz.bx;
   }

   public void a(aib $$0) {
      $$0.a(this);
   }

   public String b() {
      return this.b;
   }

   public Instant e() {
      return this.c;
   }

   public long f() {
      return this.d;
   }

   public ek g() {
      return this.e;
   }

   public yp.b h() {
      return this.f;
   }
}
