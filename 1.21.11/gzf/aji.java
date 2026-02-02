public class aji implements aay<aib> {
   public static final aao<wx, aji> a = aay.a(aji::a, aji::new);
   private final is b;
   private final iz c;
   private final aji.a d;
   private final int e;

   public aji(aji.a $$0, is $$1, iz $$2, int $$3) {
      this.d = $$0;
      this.b = $$1.j();
      this.c = $$2;
      this.e = $$3;
   }

   public aji(aji.a $$0, is $$1, iz $$2) {
      this($$0, $$1, $$2, 0);
   }

   private aji(wx $$0) {
      this.d = (aji.a)$$0.b(aji.a.class);
      this.b = $$0.e();
      this.c = iz.a($$0.readUnsignedByte());
      this.e = $$0.l();
   }

   private void a(wx $$0) {
      $$0.a((Enum)this.d);
      $$0.a(this.b);
      $$0.l(this.c.d());
      $$0.c(this.e);
   }

   public aba<aji> a() {
      return ahz.bZ;
   }

   public void a(aib $$0) {
      $$0.a(this);
   }

   public is b() {
      return this.b;
   }

   public iz e() {
      return this.c;
   }

   public aji.a f() {
      return this.d;
   }

   public int g() {
      return this.e;
   }

   public static enum a {
      a,
      b,
      c,
      d,
      e,
      f,
      g,
      h;

      // $FF: synthetic method
      private static aji.a[] a() {
         return new aji.a[]{a, b, c, d, e, f, g, h};
      }
   }
}
