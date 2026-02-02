import java.util.Optional;

public record aea(int b, jd<cez> c, int d, int e, Optional<ftm> f) implements aay<adb> {
   public static final aao<xq, aea> a = aay.a(aea::a, aea::new);

   public aea(cgk $$0, cex $$1) {
      this($$0.aA(), $$1.l(), $$1.d() != null ? $$1.d().aA() : -1, $$1.c() != null ? $$1.c().aA() : -1, Optional.ofNullable($$1.j()));
   }

   private aea(xq $$0) {
      this($$0.l(), (jd)cez.c.decode($$0), a((wx)$$0), a((wx)$$0), $$0.b(($$0x) -> {
         return new ftm($$0x.readDouble(), $$0x.readDouble(), $$0x.readDouble());
      }));
   }

   public aea(int param1, jd<cez> param2, int param3, int param4, Optional<ftm> param5) {
      this.b = $$0;
      this.c = $$1;
      this.d = $$2;
      this.e = $$3;
      this.f = $$4;
   }

   private static void a(wx $$0, int $$1) {
      $$0.c($$1 + 1);
   }

   private static int a(wx $$0) {
      return $$0.l() - 1;
   }

   private void a(xq $$0) {
      $$0.c(this.b);
      cez.c.encode($$0, this.c);
      a($$0, this.d);
      a($$0, this.e);
      $$0.a(this.f, ($$0x, $$1) -> {
         $$0x.a($$1.a());
         $$0x.a($$1.b());
         $$0x.a($$1.c());
      });
   }

   public aba<aea> a() {
      return ahz.y;
   }

   public void a(adb $$0) {
      $$0.a(this);
   }

   public cex a(dwo $$0) {
      if (this.f.isPresent()) {
         return new cex(this.c, (ftm)this.f.get());
      } else {
         cgk $$1 = $$0.a(this.d);
         cgk $$2 = $$0.a(this.e);
         return new cex(this.c, $$2, $$1);
      }
   }

   public int b() {
      return this.b;
   }

   public jd<cez> e() {
      return this.c;
   }

   public int f() {
      return this.d;
   }

   public int g() {
      return this.e;
   }

   public Optional<ftm> h() {
      return this.f;
   }
}
