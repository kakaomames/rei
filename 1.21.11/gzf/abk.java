import io.netty.buffer.ByteBuf;

public record abk(yh b) implements aay<abg> {
   public static final aao<ByteBuf, abk> a;

   public abk(yh param1) {
      this.b = $$0;
   }

   public aba<abk> a() {
      return abu.d;
   }

   public void a(abg $$0) {
      $$0.a(this);
   }

   public yh b() {
      return this.b;
   }

   static {
      a = yj.f.a(abk::new, abk::b);
   }
}
