import io.netty.buffer.ByteBuf;

public record abq(jd<asj> c) implements aay<abg> {
   public static final aao<xq, abq> a;
   public static final aao<ByteBuf, abq> b;

   public abq(jd<asj> param1) {
      this.c = $$0;
   }

   public aba<abq> a() {
      return abu.j;
   }

   public void a(abg $$0) {
      $$0.a(this);
   }

   public jd<asj> b() {
      return this.c;
   }

   static {
      a = aao.a(asj.f, abq::b, abq::new);
      b = aao.a(asj.g.a(jd::a, jd::a), abq::b, abq::new);
   }
}
